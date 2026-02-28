Full-Stack E-Commerce Platform
A functional E-commerce web application built with the MERN stack (MongoDB, Express, Node.js) and Handlebars. This project demonstrates the transition from local development to a professional cloud-hosted environment with secure authentication and real-time data management.

🚀 Live Demo
[Insert Your Render URL Here, e.g., https://nowsheer-ecommerce.onrender.com]

✨ Features
User Authentication: Secure signup and login using express-session.

Admin Panel: Dedicated dashboard for admins to add, edit, and delete products.

Order Management: Real-time tracking of customer orders with formatted date/time stamps.

Cloud Database: Fully integrated with MongoDB Atlas for scalable data persistence.

Image Uploads: Automated handling of product images.

🛠️ Tech Stack
Backend: Node.js, Express.js

Database: MongoDB Atlas

Frontend: Handlebars (HBS) with custom helpers

Deployment: Render (with CI/CD via GitHub)

Environment Management: Dotenv for securing API keys and credentials

🔧 Installation & Local Setup
Clone the repository:

Bash
git clone https://github.com/your-username/your-repo-name.git
Install dependencies:

Bash
npm install
Configure Environment Variables:
Create a .env file in the root directory and add:

Plaintext
MONGO_URL=your_mongodb_atlas_connection_string
SESSION_SECRET=your_random_secret_key
Run the application:

Bash
npm start
The app will default to http://localhost:4000.

🛡️ Security & DevOps Practices
Credential Security: Utilized .gitignore to prevent sensitive .env data from being exposed on GitHub.

IP Whitelisting: Configured Atlas Network Access for secure remote connections.

Prototype Access: Implemented Handlebars runtimeOptions to ensure secure data rendering from database objects.
