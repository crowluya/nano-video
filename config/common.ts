export const BLOGS_IMAGE_PATH = "blog-images";

export const ADMIN_UPLOAD_IMAGE_PATH = "admin-uploaded-images";

export interface R2Category {
  name: string;
  prefix: string;
}

export const R2_CATEGORIES: R2Category[] = [
  { name: "All", prefix: "" },
  {
    name: "Admin Uploads",
    prefix: `${ADMIN_UPLOAD_IMAGE_PATH}/`,
  },
  {
    name: "Blogs Images",
    prefix: `${BLOGS_IMAGE_PATH}/`,
  },
];
