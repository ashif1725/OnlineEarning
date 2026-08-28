      "#adminLogout, #logoutBtn, .logout-btn"
    );

  logoutButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        async () => {

          await logoutUser();

        }
      );
    }
  );


  setupAdminButtons();
}


// ============================================================
// ADMIN DASHBOARD
// ============================================================

async function loadAdminDashboard() {

  try {

    const [
      users,
      courses,
      payments,
      products
    ] = await Promise.all([
      getAllUsers(),
      getAllCourses(),
      getAllPayments(),
      getAllProducts()
    ]);


    setText(
      "totalUsers",
      users.length
    );

    setText(
      "totalCourses",
      courses.length
    );

    setText(
      "totalPayments",
      payments.length
    );

    setText(
      "totalProducts",
      products.length
    );


    renderUsers(users);
    renderCourses(courses);
    renderPayments(payments);
    renderProducts(products);

  } catch (error) {

    console.error(
      "Admin dashboard error:",
      error
    );

    showAdminMessage(
      "Unable to load admin data.",
      "error"
    );
  }
}


// ============================================================
// GET ALL USERS
// ============================================================

export async function getAllUsers() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "users"
      )
    );

  return snapshot.docs.map(
    (item) => ({
      id: item.id,
      ...item.data()
    })
  );
}


// ============================================================
// GET ALL COURSES
// ============================================================

export async function getAllCourses() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "courses"
      )
    );

  return snapshot.docs.map(
    (item) => ({
      id: item.id,
      ...item.data()
    })
  );
}


// ============================================================
// GET ALL PAYMENTS
// ============================================================

export async function getAllPayments() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "payments"
      )
    );

  return snapshot.docs.map(
    (item) => ({
      id: item.id,
      ...item.data()
    })
  );
}


// ============================================================
// GET ALL PRODUCTS
// ============================================================

export async function getAllProducts() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "products"
      )
    );

  return snapshot.docs.map(
    (item) => ({
      id: item.id,
      ...item.data()
    })
  );
}


// ============================================================
// ADD COURSE
// ============================================================

export async function addCourse(course) {

  if (!course) {
    throw new Error(
      "Course data is required."
    );
  }

  const courseData = {

    title:
      String(course.title || "").trim(),

    category:
      String(course.category || "General").trim(),

    description:
      String(course.description || "").trim(),

    price:
      Number(course.price || 0),

    lessons:
      Number(course.lessons || 0),

    duration:
      String(course.duration || "").trim(),

    image:
      String(course.image || "").trim(),

    published:
      course.published !== false,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp()
  };


  const result =
    await addDoc(
      collection(
        db,
        "courses"
      ),
      courseData
    );

  return result.id;
}


// ============================================================
// UPDATE COURSE
// ============================================================

export async function updateCourse(
  courseId,
  course
) {

  if (!courseId) {
    throw new Error(
      "Course ID is required."
    );
  }

  await updateDoc(
    doc(
      db,
      "courses",
      courseId
    ),
    {
      ...course,
      updatedAt:
        serverTimestamp()
    }
  );
}


// ============================================================
// DELETE COURSE
// ============================================================

export async function deleteCourse(
  courseId
) {

  if (!courseId) {
    throw new Error(
      "Course ID is required."
    );
  }

  const confirmed =
    confirm(
      "Are you sure you want to delete this course?"
    );

  if (!confirmed) {
    return false;
  }

  await deleteDoc(
    doc(
      db,
      "courses",
      courseId
    )
  );

  return true;
}


// ============================================================
// UPDATE USER ROLE
// ============================================================

export async function updateUserRole(
  uid,
  role
) {

  if (!uid) {
    throw new Error(
      "User UID is required."
    );
  }

  const allowedRoles = [
    "user",
    "admin"
  ];

  if (
    !allowedRoles.includes(
      String(role).toLowerCase()
    )
  ) {
    throw new Error(
      "Invalid role."
    );
  }

  await updateDoc(
    doc(
      db,
      "users",
      uid
    ),
    {
      role:
        String(role).toLowerCase(),

      updatedAt:
        serverTimestamp()
    }
  );

  return true;
}


// ============================================================
// UPDATE USER
// ============================================================

export async function updateUser(
  uid,
  data
) {

  if (!uid) {
    throw new Error(
      "User UID is required."
    );
  }

  await updateDoc(
    doc(
      db,
      "users",
      uid
    ),
    {
      ...data,
      updatedAt:
        serverTimestamp()
    }
  );

  return true;
}


// ============================================================
// ADD PRODUCT
// ============================================================

export async function addProduct(
  product
) {

  if (!product) {
    throw new Error(
      "Product data is required."
    );
  }

  const productData = {

    name:
      String(product.name || "").trim(),

    description:
      String(product.description || "").trim(),

    price:
      Number(product.price || 0),

    image:
      String(product.image || "").trim(),

    downloadUrl:
      String(product.downloadUrl || "").trim(),

    active:
      product.active !== false,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp()
  };


  const result =
    await addDoc(
      collection(
        db,
        "products"
      ),
      productData
    );

  return result.id;
}


// ============================================================
// DELETE PRODUCT
// ============================================================

export async function deleteProduct(
  productId
) {

  if (!productId) {
    throw new Error(
      "Product ID is required."
    );
  }

  const confirmed =
    confirm(
      "Delete this product?"
    );

  if (!confirmed) {
    return false;
  }

  await deleteDoc(
    doc(
      db,
      "products",
      productId
    )
  );

  return true;
}


// ============================================================
// APPROVE PAYMENT
// ============================================================

export async function approvePayment(
  paymentId
) {

  if (!paymentId) {
    throw new Error(
      "Payment ID is required."
    );
  }

  const paymentRef =
    doc(
      db,
      "payments",
      paymentId
    );

  const paymentSnap =
    await getDoc(
      paymentRef
    );

  if (!paymentSnap.exists()) {
    throw new Error(
      "Payment not found."
    );
  }

  const payment =
    paymentSnap.data();

  await updateDoc(
    paymentRef,
    {
      status: "approved",
      approvedAt:
        serverTimestamp()
    }
  );


  // ----------------------------------------------------------
  // If payment belongs to a course,
  // create enrollment for the user.
  // ----------------------------------------------------------

  if (
    payment.userId &&
    payment.courseId
  ) {

    const enrollmentId =
      `${payment.userId}_${payment.courseId}`;

    await setDoc(
      doc(
        db,
        "enrollments",
        enrollmentId
      ),
      {
        userId:
          payment.userId,

        courseId:
          payment.courseId,

        paymentId:
          paymentId,

        status:
          "active",

        progress:
          0,

        enrolledAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );


    // Update user's enrolled course count
    const userRef =
      doc(
        db,
        "users",
        payment.userId
      );

    const userSnap =
      await getDoc(
        userRef
      );

    if (userSnap.exists()) {

      const user =
        userSnap.data();

      await updateDoc(
        userRef,
        {
          enrolledCourses:
            Number(
              user.enrolledCourses || 0
            ) + 1,

          updatedAt:
            serverTimestamp()
        }
      );
    }
  }

  return true;
}


// ============================================================
// REJECT PAYMENT
// ============================================================

export async function rejectPayment(
  paymentId,
  reason = ""
) {

  if (!paymentId) {
    throw new Error(
      "Payment ID is required."
    );
  }

  await updateDoc(
    doc(
      db,
      "payments",
      paymentId
    ),
    {
      status: "rejected",

      rejectionReason:
        String(reason || "").trim(),

      rejectedAt:
        serverTimestamp()
    }
  );

  return true;
}


// ============================================================
// RENDER USERS
// ============================================================

function renderUsers(users) {

  const container =
    document.getElementById(
      "usersList"
    );

  if (!container) return;

  if (!users.length) {

    container.innerHTML =
      "<p>No users found.</p>";

    return;
  }


  container.innerHTML =
    users.map(
      (user) => {

        const role =
          user.role || "user";

        return `
          <div class="admin-user-card">

            <div>
              <strong>
                ${escapeHTML(
                  user.name || "Member"
                )}
              </strong>

              <small>
                ${escapeHTML(
                  user.email || ""
                )}
              </small>
            </div>

            <div>
              <span>
                ${escapeHTML(role)}
              </span>

              <button
                class="change-role-btn"
                data-uid="${escapeAttr(
                  user.id
                )}"
                data-role="${
                  role === "admin"
                    ? "user"
                    : "admin"
                }"
              >
                ${
                  role === "admin"
                    ? "Remove Admin"
                    : "Make Admin"
                }
              </button>
            </div>

          </div>
        `;
      }
    ).join("");


  container
    .querySelectorAll(
      ".change-role-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const uid =
              button.dataset.uid;

            const newRole =
              button.dataset.role;

            try {

              await updateUserRole(
                uid,
                newRole
              );

              alert(
                `User role changed to ${newRole}.`
              );

              await loadAdminDashboard();

            } catch (error) {

              console.error(error);

              alert(
                "Unable to update role."
              );
            }
          }
        );
      }
    );
}


// ============================================================
// RENDER COURSES
// ============================================================

function renderCourses(courses) {

  const container =
    document.getElementById(
      "coursesList"
    );

  if (!container) return;

  if (!courses.length) {

    container.innerHTML =
      "<p>No courses found.</p>";

    return;
  }


  container.innerHTML =
    courses.map(
      (course) => `

        <div class="admin-course-card">

          <h3>
            ${escapeHTML(
              course.title || "Untitled Course"
            )}
          </h3>

          <p>
            ${escapeHTML(
              course.description || ""
            )}
          </p>

          <strong>
            ₹${Number(
              course.price || 0
            )}
          </strong>

          <button
            class="delete-course-btn"
            data-id="${escapeAttr(
              course.id
            )}"
          >
            Delete
          </button>

        </div>

      `
    ).join("");


  container
    .querySelectorAll(
      ".delete-course-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            try {

              await deleteCourse(
                button.dataset.id
              );

              await loadAdminDashboard();

            } catch (error) {

              console.error(error);

              alert(
                "Unable to delete course."
              );
            }
          }
        );
      }
    );
}


// ============================================================
// RENDER PAYMENTS
// ============================================================

function renderPayments(
  payments
) {

  const container =
    document.getElementById(
      "paymentsList"
    );

  if (!container) return;

  if (!payments.length) {

    container.innerHTML =
      "<p>No payments found.</p>";

    return;
  }


  container.innerHTML =
    payments.map(
      (payment) => `

        <div class="admin-payment-card">

          <strong>
            ₹${Number(
              payment.amount || 0
            )}
          </strong>

          <span>
            Status:
            ${escapeHTML(
              payment.status || "pending"
            )}
          </span>

          <small>
            User:
            ${escapeHTML(
              payment.userId || "-"
            )}
          </small>

          ${
            payment.status === "pending"
              ? `
                <div>

                  <button
                    class="approve-payment-btn"
                    data-id="${escapeAttr(
                      payment.id
                    )}"
                  >
                    Approve
                  </button>

                  <button
                    class="reject-payment-btn"
                    data-id="${escapeAttr(
                      payment.id
                    )}"
                  >
                    Reject
                  </button>

                </div>
              `
              : ""
          }

        </div>

      `
    ).join("");


  container
    .querySelectorAll(
      ".approve-payment-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            try {

              await approvePayment(
                button.dataset.id
              );

              alert(
                "Payment approved and enrollment created."
              );

              await loadAdminDashboard();

            } catch (error) {

              console.error(error);

              alert(
                "Unable to approve payment."
              );
            }
          }
        );
      }
    );


  container
    .querySelectorAll(
      ".reject-payment-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const reason =
              prompt(
                "Rejection reason:"
              );

            try {

              await rejectPayment(
                button.dataset.id,
                reason || ""
              );

              await loadAdminDashboard();

            } catch (error) {

              console.error(error);

              alert(
                "Unable to reject payment."
              );
            }
          }
        );
      }
    );
}


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProducts(
  products
) {

  const container =
    document.getElementById(
      "productsList"
    );

  if (!container) return;

  if (!products.length) {

    container.innerHTML =
      "<p>No products found.</p>";

    return;
  }


  container.innerHTML =
    products.map(
      (product) => `

        <div class="admin-product-card">

          <h3>
            ${escapeHTML(
              product.name || "Product"
            )}
          </h3>

          <p>
            ${escapeHTML(
              product.description || ""
            )}
          </p>

          <strong>
            ₹${Number(
              product.price || 0
            )}
          </strong>

        </div>

      `
    ).join("");
}


// ============================================================
// ADMIN BUTTONS
// ============================================================

function setupAdminButtons() {

  const refreshButton =
    document.getElementById(
      "refreshAdmin"
    );

  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      async () => {

        await loadAdminDashboard();

      }
    );
  }
}


// ============================================================
// HELPERS
// ============================================================

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value;
  }
}


function showAdminMessage(
  message,
  type = "info"
) {

  const element =
    document.getElementById(
      "adminMessage"
    );

  if (!element) {
    console.log(message);
    return;
  }

  element.textContent =
    message;

  element.className =
    `admin-message ${type}`;

  element.style.display =
    "block";
}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttr(value) {

  return escapeHTML(value);
}


// ============================================================
// GLOBAL ADMIN API
// ============================================================

window.SkillEarnAdmin = {

  loadAdminDashboard,

  getAllUsers,

  getAllCourses,

  getAllPayments,

  getAllProducts,

  addCourse,

  updateCourse,

  deleteCourse,

  updateUserRole,

  updateUser,

  addProduct,

  deleteProduct,

  approvePayment,

  rejectPayment
};
