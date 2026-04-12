# CS4218 Project - Virtual Vault

## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:

   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```

## Workload Distribution
### 1. Chia Jia Ye (A0286580U)
   - **Protected Routes, Registration and Login Features**
     - context/auth.js
     - context/auth.test.js
     - helpers/authHelper.js
     - helpers/authHelper.test.js
     - middlewares/authMiddleware.js
     - middlewares/authMiddleware.test.js
     - pages/Auth/Login.js
     - pages/Auth/Login.test.js
     - pages/Auth/Register.js
     - pages/Auth/Register.test.js
     - controllers/authController.js
        - registerController
        - loginController
        - forgotPasswordController
        - testController
     - controllers/authController.test.js


   ### 2. Dexter Wong Xing You (A0255437Y)
   - Set up CI/CD pipeline
   - .github/workflows/ci.yml
   - **Product Features**
     - controllers/productController.js
     - controllers/productController.test.js
        - createProductController
        - getProductController
        - getSingleProductController
        - productPhotoController
        - deleteProductController
        - updateProductController
        - productFiltersController
        - productCountController
        - productListController
        - searchProductController
        - realtedProductController
        - productCategoryController
        - braintreeTokenController
        - brainTreePaymentController

### 3. Charles Lim Jun Wei (A0277527R)
- **Order and Payment Features**
  - pages/user/Orders.js
  - pages/user/Orders.test.js
  - controllers/authController.js
    - updateProfileController
    - getOrdersController
    - getAllOrdersController
    - orderStatusController
    - models/orderModel.js
  - controllers/authController.order.test.js
  - controllers/authController.js
      - braintreeTokenController
      - brainTreePaymentController
  - controllers/productController.payment.test.js
    

### MS1 CI URL:
#### https://github.com/cs4218/cs4218-2520-ecom-project-cs4218-2520-team29/actions/runs/22291359700/job/64479084483

---

## MS2
### Integration Testing Workload Distribution
### 1. Chia Jia Ye (A0286580U)
#### Components Tested:
The integration tests cover multiple backend components:

- **Routes** (`/api/v1/auth/*`)
- **Controllers**
  - `registerController`
  - `loginController`
- **Middleware**
  - `requireSignIn`
  - `isAdmin`
- **Database (MongoDB)**
  - user creation
  - duplicate email handling
  - data persistence

---

#### Test Suites Implemented:
#### 1. User Registration Integration Tests (`authRegister.test.js`)

Focus:
- Input validation
- Database persistence
- Controller–model interaction

Key scenarios:
- Successful registration with valid data
- Duplicate email rejection
- Email format validation
- Password strength validation
- Password confirmation mismatch
- Missing required fields
- Input trimming and normalization
- Registration followed by login

---

#### 2. User Login Integration Tests (`authLogin.test.js`)

Focus:
- Authentication flow
- JWT token generation
- Controller–database interaction

Key scenarios:
- Successful login with valid credentials
- Rejection of invalid credentials (wrong password / non-existent user)
- Validation of missing fields
- JWT token generation and structure
- Ensuring password is not exposed in response
- Register → Login workflow validation

---

#### 3. Authentication Middleware Integration Tests (`authMiddleware.test.js`)

Focus:
- Authorization and access control
- Middleware integration with authentication

Key scenarios:
- Access to protected routes with valid token
- Rejection of requests without token
- Rejection of invalid tokens
- Role-based access control (admin vs user)
- Verification of JWT expiration claim

---

### 2. Dexter Wong Xing You (A0255437Y)

#### Components Tested:
The integration tests focus on product-related workflows across backend components:

- **Routes** (`/api/v1/product/*`)
- **Controllers**
  - `createProductController`
  - `updateProductController`
  - `getProductController`
- **Middleware**
  - `requireSignIn`
  - `isAdmin`
- **Database (MongoDB)**
  - product creation
  - product updates
  - category association
  - data consistency across endpoints

---

#### Test Suites Implemented:

#### 1. Product Listing Flow Integration Tests (`productListingFlow.test.js`)

Focus:
- Retrieval of products across endpoints
- Consistency between listing and single product views

Key scenarios:
- Fetching all products successfully
- Retrieving a product by slug
- Ensuring consistency between listing and detailed view
- Validation of response structure
- Handling of empty or invalid queries

---

#### 2. Admin Product Creation → Listing Integration Tests (`adminProductCreationListing.test.js`)

Focus:
- End-to-end product creation flow
- Integration between admin routes and database

Key scenarios:
- Successful product creation by admin
- Validation of required fields
- Authentication and authorization checks
- Persistence of product data in database
- Newly created product appears in product listing

---

#### 3. Admin Product Update → Retrieval Integration Tests (`adminProductUpdateRetrieval.test.js`)

Focus:
- Product update workflow
- Data consistency after updates

Key scenarios:
- Successful update of product details
- Updated values reflected in product retrieval
- Validation of required fields during update
- Unauthorized update attempts are rejected
- Ensuring only the targeted product is updated

---

### 3. Charles Lim Jun Wei (A0277527R)

#### Components Tested:

The integration tests cover multiple backend components:

- **Routes**
    - `/api/v1/auth/orders`
    - `/api/v1/auth/all-orders`
    - `/api/v1/auth/order-status/:orderId`
    - `/api/v1/product/braintree/*`
    - `/api/v1/auth/login`

- **Controllers**
    - `getOrdersController`
    - `getAllOrdersController`
    - `orderStatusController`
    - `brainTreePaymentController`
    - `braintreeTokenController`
    - `loginController`

- **Middleware**
    - `requireSignIn`
    - `isAdmin`

- **Database (MongoDB)**
    - order creation and retrieval
    - order status updates
    - user authentication linkage (buyer ↔ orders)
    - data persistence across requests

- **External Dependency**
    - Braintree payment gateway (mocked)

---

### Test Suites Implemented:

#### 1. Orders Integration Tests (`orders.integration.test.js`)

**Focus:**
- Orders API workflow
- Controller–model interaction
- Authorization and role-based access control
- Data persistence and retrieval

**Key scenarios:**
- Authenticated user retrieves their own orders
- Admin retrieves all orders
- Admin updates order status successfully
- Non-admin user is blocked from admin endpoints
- Unauthenticated requests are rejected
- Orders are returned with correct populated fields (excluding sensitive data)

---

#### 2. Payment → Order Integration Tests (`payment.integration.test.js`)

**Focus:**
- Payment processing workflow
- Interaction between payment controller and order creation
- External service handling (Braintree)
- Authentication + payment + persistence pipeline

**Key scenarios:**
- Braintree token generation success and failure
- Successful payment creates a new order in the database
- Payment amount correctly matches cart total
- Failed payment does not create an order
- Unauthenticated or invalid-token requests are rejected
- Orders created are correctly associated with the authenticated user
- Multiple users create independent orders

---

#### 3. Auth → Orders Integration Tests (`authOrders.integration.test.js`)

**Focus:**
- Authentication flow to protected resource access
- Token generation and validation
- Cross-module interaction between Auth and Orders

**Key scenarios:**
- Successful login generates a valid token
- Login-issued token grants access to Orders endpoint
- Orders returned belong only to the authenticated user
- Invalid login credentials do not produce a usable token
- Unauthenticated requests to Orders are rejected

---

### UI Testing Workload Distribution
### 1. Chia Jia Ye (A0286580U)
#### Components Tested:

The UI tests cover multiple features and pages:

- **Authentication Pages**
  - Register (`/register`)
  - Login (`/login`)

- **Protected Pages**
  - Profile (`/dashboard/user/profile`)

- **Navigation Components**
  - Header (login/logout, user dropdown)

---

### 2. Dexter Wong Xing You (A0255437Y)

#### Components Tested:

The UI tests focus on admin-side product and category management:

- **Admin Pages**
  - Create Category (`/dashboard/admin/create-category`)
  - Create Product (`/dashboard/admin/create-product`)
  - Update Product (`/dashboard/admin/products`)

---

#### Test Suites Implemented:

#### 1. Create Category UI Tests (`createCategory.spec.js`)

Focus:
- Admin category management workflow

Scenarios tested include:
- Creating a new category successfully
- Editing an existing category
- Deleting a category
- Verifying category updates in table view

---

#### 2. Create Product UI Tests (`createProduct.spec.js`)

Focus:
- Admin product creation workflow

Scenarios tested include:
- Create product page loads with required fields
- Admin fills and submits product creation form
- Navigation between admin pages after product creation
- Basic validation of form interaction

---

#### 3. Update Product UI Tests (`updateProduct.spec.js`)

Focus:
- Admin product update workflow

Scenarios tested include:
- Opening an existing product (Novel) in update page
- Updating product name
- Updating product description
- Verifying updates are reflected in admin product list
- Reverting product back to original values to maintain database consistency

---

### 3. Charles Lim Jun Wei (A0277527R)

#### Components Tested:

The UI tests focus on user-side product browsing, product details viewing, and order viewing workflows:

- **User Pages**
    - Category Product (`pages/CategoryProduct.js`)
    - Product Details (`pages/ProductDetails.js`)
    - Orders (`pages/user/Order.js`)

---

### Test Suites Implemented:

#### 1. Category Product UI Tests (`category-product.spec.js`)

**Focus:**

- Category browsing and product navigation workflow

**Scenarios tested include:**

- Navigating to the All Categories page
- Selecting a category from the category list
- Verifying navigation to `/category/:slug`
- Verifying category name and result count are displayed
- Verifying product cards render correctly for the selected category
- Verifying each product card shows image, name, description, and price
- Clicking **More Details** to navigate to `/product/:slug`
- Verifying direct access to the category route works correctly

---

#### 2. Product Details UI Tests (`product-details.spec.js`)

**Focus:**

- Product details display and related product navigation workflow

**Scenarios tested include:**

- Navigating directly to `/product/:slug` and verifying product details load
- Verifying product image, name, description, price, and category are displayed
- Verifying the **Add to Cart** button is visible and enabled
- Verifying the **Similar Products** section appears
- If related products exist, clicking **More Details** navigates to another product details page
- If no related products exist, displaying the message **“No Similar Products found”**
- Verifying direct access to the product details route works correctly

---

#### 3. Orders UI Tests (`orders.spec.js`)

**Focus:**

- Authenticated user order viewing workflow

**Scenarios tested include:**

- Verifying the Orders page loads successfully for an authenticated user
- Verifying the **All Orders** heading is displayed
- Verifying order summary information such as status, buyer, payment state, quantity, and relative date is displayed
- Verifying ordered product entries render correctly within each order
- Verifying ordered product rows show image, name, description, and price
- Verifying product images are rendered with valid product photo URLs
- Verifying one summary row is shown per order
- Verifying direct access to the Orders page works correctly for an authenticated user

---
## MS3
### Performance Testing Distribution
### 1. Chia Jia Ye (A0286580U)
- Implemented load testing using Grafana k6 to evaluate system performance under concurrent user activity.

- Tested two key endpoints:
  - `POST /api/v1/auth/login` (authentication flow)
  - `GET /api/v1/auth/orders` (authenticated order retrieval)

- Designed tests using a ramping virtual user model:
  - 0 → 20 users over 1 minute (ramp-up)
  - sustained at 20 users for 3 minutes
  - 20 → 0 users over 1 minute (ramp-down)
  - included 1-second think time between requests to simulate realistic usage

- For login testing:
  - each virtual user repeatedly sends login requests
  - validates response status, success flag, and presence of token

- For orders testing:
  - implemented a setup phase to authenticate once
  - reused the returned token for subsequent requests
  - isolates performance of order retrieval from login overhead

- Evaluated performance using the following metrics:
  - average, median, and p95 response time
  - error rate
  - throughput (requests per second)
  - checks pass rate (response correctness)

- Defined thresholds:
  - error rate < 1%
  - p95 response time < 500ms
  - checks pass rate > 99%

---

  ### 2. Dexter Wong Xing You (A0255437Y)

- Implemented spike testing using Grafana k6 to evaluate system behaviour under sudden traffic surges.
- Tested endpoint:
  - `GET /api/v1/product/product-list/1`
- Designed a spike scenario with:
  - baseline load at 5 users
  - sudden spike to 80 users
  - sustained spike period
  - recovery phase back to baseline
- Evaluated:
  - p95 response time
  - error rate
  - requests per second
  - checks pass rate
- Defined thresholds:
  - error rate < 5%
  - p95 response time < 2000ms
  - checks pass rate > 95%
- Focused on recovery behaviour after the spike, making this distinct from steady-state load testing.

---

### 3. Charles Lim Jun Wei (A0277527R)

- Non-Functional Testing: **Stress Testing**
- Implemented stress testing using **Grafana k6** to evaluate system performance, degradation behaviour, 
and breaking points under `tests/stress-tests`

**Stress Test Scripts:**
- `stress-login.test.js`
    - Focused test on authentication endpoint (`/api/v1/auth/login`)
    - Identifies early degradation due to auth load and evaluates recovery behaviour

- `stress-browse.test.js`
    - Tests unauthenticated read endpoints:
        - category retrieval
        - product listing
        - search
    - Establishes baseline performance for read-heavy operations

- `stress-product-detail.test.js`
    - Isolates product detail flow:
        - single product retrieval
        - related products
    - Identifies performance of high-traffic product pages during major sale scenarios

- `stress-journey.test.js`
    - Simulates end-to-end user behaviour:
        - login (once per VU)
        - browse → search → product → orders
    - Evaluates system behaviour under realistic user interactions

**Results Generated:**
- `results-login.txt`
- `results-browse.txt`
- `results-product-detail.txt`
- `results-journey.txt`

**Tests Configurations:**
- Designed stage-based load profiles (gradual ramp-up, peak, recovery)
- Implemented metrics:
    - p95 latency
    - functional error rate
    - SLA breach rate
- Defined thresholds based on expected user experience:
  - Login: p95 < 5s (authentication can tolerate slightly higher latency)
  - Browse/Search: p95 < 2s (expected to remain responsive under load)
  - Product detail: p95 < 3s (moderate complexity due to additional data retrieval)
  - Functional error rate < 5–10% depending on test scenario

---