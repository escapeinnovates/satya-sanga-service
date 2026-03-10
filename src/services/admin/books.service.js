const axios = require("axios");
const AdmZip = require("adm-zip");
const slugify = require("slugify");
const r2 = require("../../config/r2");
const redis = require("../../redis/redisClient");

const {
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand
} = require("@aws-sdk/client-s3");

const WORKER = process.env.WORKER_BASE_URL;

const worker = axios.create({
  baseURL: WORKER,
});

const BOOKS_CACHE = "app:books";
const BOOK_PREFIX = "app:book:";

const clearBookCache = async (bookId = null) => {
  await redis.del(BOOKS_CACHE);
  if (bookId) {
    await redis.del(`${BOOK_PREFIX}${bookId}`);
  }
};


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

  if (zipFile) {
    await exports.processZip(bookId, folderKey, zipFile);
  }

  await clearBookCache(bookId);

  return bookId;
};


// =================================================
// UPDATE BOOK
// =================================================
exports.updateBook = async (id, data) => {
  await worker.put(`/books/${id}`, data);
  await clearBookCache(id);
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

  await clearBookCache(bookId);
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

  const oldKey = page.image_url.replace(
    `${process.env.R2_PUBLIC_URL}/`,
    ""
  );

  const folder = oldKey.split("/").slice(0, -1).join("/");
  const ext = file.originalname.split(".").pop().toLowerCase();
  const baseName = page.file_name.replace(/\.[^/.]+$/, "");

  const newKey = `${folder}/${baseName}_${Date.now()}.${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: newKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const newUrl = `${process.env.R2_PUBLIC_URL}/${newKey}`;

  await worker.put(`/books/book-pages/${pageId}`, { image_url: newUrl });

  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: oldKey,
    })
  );

  await clearBookCache(page.book_id);

  return { imageUrl: newUrl };
};


// =================================================
// UPDATE PAGE META
// =================================================
exports.updatePageMeta = async (pageId, data) => {

  const pageRes = await worker.get(`/books/book-pages/${pageId}`);
  const page = pageRes.data;

  const oldKey = page.image_url.replace(
    `${process.env.R2_PUBLIC_URL}/`,
    ""
  );

  const ext = oldKey.split(".").pop();
  const folder = oldKey.split("/").slice(0, -1).join("/");

  const cleanName = slugify(data.file_name, {
    lower: true,
    strict: true,
  });

  const newFileName = `${cleanName}.${ext}`;
  const newKey = `${folder}/${newFileName}`;

  await r2.send(
    new CopyObjectCommand({
      Bucket: process.env.R2_BUCKET,
      CopySource: `${process.env.R2_BUCKET}/${oldKey}`,
      Key: newKey,
    })
  );

  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: oldKey,
    })
  );

  const newUrl = `${process.env.R2_PUBLIC_URL}/${newKey}`;

  await worker.put(`/books/book-pages/${pageId}`, {
    file_name: data.file_name,
    image_url: newUrl,
  });

  await clearBookCache(page.book_id);

  return { success: true };
};


// =================================================
// DELETE PAGE
// =================================================
exports.deletePage = async (id) => {

  const pageRes = await worker.get(`/books/book-pages/${id}`);
  const page = pageRes.data;

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

  await worker.delete(`/books/book-pages/${id}`);

  await clearBookCache(page.book_id);

  return { success: true };
};


// =================================================
// DELETE BOOK
// =================================================
exports.deleteBook = async (id) => {

  const bookRes = await worker.get(`/books/${id}`);
  const book = bookRes.data;

  const pagesRes = await worker.get(`/books/${id}/pages`);
  const pages = pagesRes.data || [];

  for (const page of pages) {

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

  await worker.delete(`/books/${id}`);

  await clearBookCache(id);

  return { success: true };
};


// =================================================
// UPLOAD MULTIPLE PAGES
// =================================================
exports.uploadMultiplePages = async (bookId, files) => {

  const bookRes = await worker.get(`/books/${bookId}`);
  const book = bookRes.data;

  const folderKey = book.folder_key;

  const pagesRes = await worker.get(`/books/${bookId}/pages`);
  const currentPages = pagesRes.data || [];

  let pageNumber = currentPages.length + 1;

  const pagesPayload = [];

  for (const file of files) {

    const ext = file.originalname.split(".").pop().toLowerCase();

    const fileName = `${folderKey}_${String(pageNumber).padStart(3, "0")}.${ext}`;
    const key = `books/${folderKey}/${fileName}`;

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

  await worker.post(`/books/${bookId}/pages/bulk`, {
    pages: pagesPayload,
  });

  await clearBookCache(bookId);

  return { success: true };
};


// =================================================
// UPDATE COVER
// =================================================
exports.updateCover = async (bookId, file) => {

  const bookRes = await worker.get(`/books/${bookId}`);
  const book = bookRes.data;

  const folderKey = book.folder_key;

  const ext = file.originalname.split(".").pop().toLowerCase();
  const newKey = `books/${folderKey}/cover_${Date.now()}.${ext}`;

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: newKey,
    Body: file.buffer,
    ContentType: file.mimetype
  }));

  const newUrl = `${process.env.R2_PUBLIC_URL}/${newKey}`;

  await worker.put(`/books/${bookId}`, {
    cover_url: newUrl
  });

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

  await clearBookCache(bookId);

  return newUrl;
};


// =================================================
// REORDER PAGES
// =================================================
exports.reorderPages = async (bookId, pages) => {

  await worker.put(`/books/${bookId}/pages/reorder`, {
    pages
  });

  await clearBookCache(bookId);

  return { success: true };
};