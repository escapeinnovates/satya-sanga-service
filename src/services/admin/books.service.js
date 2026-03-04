const axios = require("axios");
const AdmZip = require("adm-zip");
const slugify = require("slugify");
const r2 = require("../../config/r2");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { DeleteObjectCommand, ListObjectsV2Command, CopyObjectCommand } = require("@aws-sdk/client-s3");
const WORKER = process.env.WORKER_BASE_URL;

const worker = axios.create({
  baseURL: WORKER,
});

// =================================================
// GET ALL BOOKS
// =================================================
exports.getAll = async () => {
  const res = await worker.get("/books");
  return res.data;
};

// =================================================
// GET BOOK BY ID
// =================================================
exports.getById = async (id) => {
  const res = await worker.get(`/books/${id}`);
  return res.data;
};

// =================================================
// CREATE BOOK
// =================================================
exports.createBook = async (data, coverFile, zipFile) => {
  const folderKey = slugify(data.title, { lower: true, strict: true });

  const res = await worker.post("/books", {
    title: data.title,
    slug: folderKey,
    folder_key: folderKey,
    is_active: data.is_active ?? 1,
    total_pages: 0
  });

  const bookId = res.data.id;

  // Upload cover
  if (coverFile) {
    const ext = coverFile.originalname.split(".").pop();
    const coverKey = `books/${folderKey}/cover.${ext}`;

    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: coverKey,
      Body: coverFile.buffer,
      ContentType: coverFile.mimetype
    }));

    const coverUrl = `${process.env.R2_PUBLIC_URL}/${coverKey}`;

    await worker.put(`/books/${bookId}`, {
      cover_url: coverUrl
    });
  }

  // Process ZIP
  if (zipFile) {
    await exports.processZip(bookId, folderKey, zipFile);
  }

  return bookId;
};

// =================================================
// UPDATE BOOK (NO FILES)
// =================================================
exports.updateBook = async (id, data) => {
  await worker.put(`/books/${id}`, data);
  return { success: true };
};

// =================================================
// PROCESS ZIP
// =================================================
exports.processZip = async (bookId, folderKey, zipFile) => {
  const zip = new AdmZip(zipFile.buffer);
  const entries = zip.getEntries();

  const imageFiles = entries
    .filter(e =>
      !e.isDirectory &&
      /\.(png|jpg|jpeg|webp)$/i.test(e.entryName)
    )
    .sort((a, b) => a.entryName.localeCompare(b.entryName));

  let pageNumber = 1;

  for (const file of imageFiles) {
    const ext = file.entryName.split(".").pop();
    const padded = String(pageNumber).padStart(3, "0");
    const fileName = `${folderKey}_${padded}.${ext}`;
    const key = `books/${folderKey}/${fileName}`;

    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.getData(),
      ContentType: `image/${ext}`
    }));

    const imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    await worker.post("/book-pages", {
      book_id: bookId,
      file_name: fileName,
      image_url: imageUrl,
      page_number: pageNumber
    });

    pageNumber++;
  }

  await worker.put(`/books/${bookId}`, {
    total_pages: imageFiles.length
  });
};

// =================================================
// GET BOOK PAGES
// =================================================
exports.getPages = async (bookId) => {
  const res = await worker.get(`/books/${bookId}/pages`);
  return res.data;
};

// =================================================
// UPDATE PAGE IMAGE
// =================================================
exports.updatePageImage = async (pageId, file) => {
  if (!file) throw new Error("No file uploaded");

  const pageRes = await worker.get(`/books/book-pages/${pageId}`);

  const page = pageRes.data;

  if (!page) throw new Error("Page not found");

  const oldKey = page.image_url.replace(
    `${process.env.R2_PUBLIC_URL}/`,
    ""
  );

  const folder = oldKey.split("/").slice(0, -1).join("/");

  const ext = file.originalname.split(".").pop().toLowerCase();

  const baseName = page.file_name.replace(/\.[^/.]+$/, "");

  const newKey = `${folder}/${baseName}_${Date.now()}.${ext}`;

  // 1️⃣ Upload new image
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: newKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const newUrl = `${process.env.R2_PUBLIC_URL}/${newKey}`;

  // 2️⃣ Update DB
  await worker.put(`/books/book-pages/${pageId}`, { image_url: newUrl });

  // 3️⃣ Delete old image AFTER DB success
  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: oldKey,
    })
  );

  return { imageUrl: newUrl };
};

// =================================================
// UPDATE PAGE META
// =================================================
exports.updatePageMeta = async (pageId, data) => {
  const pageRes = await worker.get(`/books/book-pages/${pageId}`);
  const page = pageRes.data;

  if (!page) throw new Error("Page not found");

  const oldKey = page.image_url.replace(
    `${process.env.R2_PUBLIC_URL}/`,
    ""
  );

  const ext = oldKey.split(".").pop();
  const folder = oldKey.split("/").slice(0, -1).join("/");

  if (!data.file_name || data.file_name.trim() === "") {
    throw new Error("Invalid file name");
  }

  const cleanName = slugify(data.file_name, {
    lower: true,
    strict: true,
  });

  const newFileName = `${cleanName}.${ext}`;
  const newKey = `${folder}/${newFileName}`;

  // Copy in R2
  await r2.send(
    new CopyObjectCommand({
      Bucket: process.env.R2_BUCKET,
      CopySource: `${process.env.R2_BUCKET}/${oldKey}`,
      Key: newKey,
    })
  );

  // Delete old object
  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: oldKey,
    })
  );

  const newUrl = `${process.env.R2_PUBLIC_URL}/${newKey}`;

  // ✅ Correct Worker endpoint
  await worker.put(`/books/book-pages/${pageId}`, {
    file_name: data.file_name,
    image_url: newUrl,
  });

  return { success: true };
};
// =================================================
// DELETE PAGE
// =================================================
exports.deletePage = async (id) => {
  // 1. Get page from Worker
  const pageRes = await worker.get(`/books/book-pages/${id}`);
  const page = pageRes.data;

  if (!page) throw new Error("Page not found");

  // 2. Delete from R2 first
  if (page.image_url) {
    const key = page.image_url.replace(
      `${process.env.R2_PUBLIC_URL}/`,
      ""
    );

    await r2.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    }));
  }

  // 3. Delete from DB
  await worker.delete(`/books/book-pages/${id}`);

  return { success: true };
};
// =================================================
// DELETE BOOK
// =================================================
exports.deleteBook = async (id) => {
  const bookRes = await worker.get(`/books/${id}`);
  const book = bookRes.data;

  if (!book) throw new Error("Book not found");

  // Get pages
  const pagesRes = await worker.get(`/books/${id}/pages`);
  const pages = pagesRes.data || [];

  // Delete page images
  for (const page of pages) {
    if (page.image_url) {
      const key = page.image_url.replace(
        `${process.env.R2_PUBLIC_URL}/`,
        ""
      );

      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
        })
      );
    }
  }

  // Delete cover
  if (book.cover_url) {
    const coverKey = book.cover_url.replace(
      `${process.env.R2_PUBLIC_URL}/`,
      ""
    );

    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: coverKey,
      })
    );
  }

  // Soft delete in Worker
  await worker.delete(`/books/${id}`);

  return { success: true };
};

exports.uploadMultiplePages = async (bookId, files) => {
  // 1️⃣ Get book to read folder_key
  const bookRes = await worker.get(`/books/${bookId}`);
  const book = bookRes.data;

  if (!book) throw new Error("Book not found");

  const folderKey = book.folder_key;

  // 2️⃣ Get current pages
  const pagesRes = await worker.get(`/books/${bookId}/pages`);
  const currentPages = pagesRes.data || [];

  let pageNumber = currentPages.length + 1;

  const pagesPayload = [];

  for (const file of files) {
    const ext = file.originalname.split(".").pop().toLowerCase();

    const fileName = `${folderKey}_${String(pageNumber).padStart(3, "0")}.${ext}`;
    const key = `books/${folderKey}/${fileName}`;

    // Upload to R2
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    pagesPayload.push({
      file_name: fileName,
      image_url: imageUrl,
    });

    pageNumber++;
  }

  // 3️⃣ Bulk insert
  await worker.post(`/books/${bookId}/pages/bulk`, {
    pages: pagesPayload,
  });

  return { success: true };
};

exports.updateCover = async (bookId, file) => {
  if (!file) throw new Error("No file uploaded");

  const bookRes = await worker.get(`/books/${bookId}`);
  const book = bookRes.data;

  if (!book) throw new Error("Book not found");

  const folderKey = book.folder_key;

  if (!folderKey) throw new Error("Invalid folder key");

  // Validate file type
  if (!file.mimetype.startsWith("image/")) {
    throw new Error("Invalid file type");
  }

  const ext = file.originalname.split(".").pop().toLowerCase();
  const newKey = `books/${folderKey}/cover_${Date.now()}.${ext}`;

  // 1️⃣ Upload new cover first
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: newKey,
    Body: file.buffer,
    ContentType: file.mimetype
  }));

  const newUrl = `${process.env.R2_PUBLIC_URL}/${newKey}`;

  // 2️⃣ Update DB
  await worker.put(`/books/${bookId}`, {
    cover_url: newUrl
  });

  // 3️⃣ Delete old cover ONLY IF different
  if (book.cover_url) {
    const oldKey = book.cover_url.replace(
      `${process.env.R2_PUBLIC_URL}/`,
      ""
    );

    if (oldKey !== newKey) {
      await r2.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: oldKey,
      }));
    }
  }

  return newUrl;
};

exports.reorderPages = async (bookId, pages) => {
  await worker.put(`/books/${bookId}/pages/reorder`, {
    pages
  });
  return { success: true };
};