# School Scheduling System

A comprehensive scheduling system built with React frontend, Spring Boot backend, and Firebase database integration. This system allows administrators to manage classrooms, teachers, and automatically generate conflict-free schedules with a single click.

## Features

- **Classroom Management**: Add, edit, and delete classroom information including room type, capacity, and location
- **Teacher Management**: Manage teacher profiles with availability schedules and subject assignments
- **Schedule Management**: View and manage existing schedules
- **One-Click Schedule Generation**: Automatically generate conflict-free schedules based on teacher availability and classroom requirements
- **Real-time Conflict Detection**: Advanced algorithm ensures no scheduling conflicts between teachers and classrooms
- **Responsive Design**: Modern Material-UI interface that works on all devices

## Technology Stack

### Frontend
- **React**: 19.0.0
- **React DOM**: 19.0.0
- **React Router DOM**: 6.20.1
- **Material-UI (MUI)**: 6.4.7
- **MUI Icons Material**: 6.4.7
- **MUI X Date Pickers**: 6.18.3
- **Emotion React**: 11.14.0
- **Emotion Styled**: 11.14.0
- **Axios**: 1.6.2
- **Day.js**: 1.11.10
- **Firebase**: 10.14.1
- **React Scripts**: 5.0.1
- **Web Vitals**: 2.1.4

### Backend
- **Spring Boot**: 3.2.0
- **Java**: 17
- **Spring Boot Starter Web**: 3.2.0
- **Spring Boot Starter Data JPA**: 3.2.0
- **Spring Boot Starter Validation**: 3.2.0
- **Spring Boot Starter Test**: 3.2.0
- **Firebase Admin SDK**: 9.2.0
- **Jackson Databind**: (Managed by Spring Boot)
- **H2 Database**: (Runtime scope, for development)
- **Maven**: 3.6+ (Build tool)

### Infrastructure & Services
- **Firebase Firestore**: Cloud database
- **Firebase Authentication**: User authentication
- **Firebase Hosting**: (Optional) Frontend hosting
- **H2 Database**: In-memory database for development

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v16.0.0 or higher (v18+ recommended)
- **npm**: v7.0.0 or higher (comes with Node.js)
- **Java**: JDK 17 or higher
- **Maven**: 3.6.0 or higher
- **Firebase Account**: With a project created
- **Git**: For version control (optional)

## Getting Started

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create Firebase Service Account:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create a new one)
   - Navigate to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the downloaded JSON file as `firebase-service-account.json`
   - Place it in `backend/src/main/resources/`

3. **Configure Firebase in application.properties:**
   ```bash
   # Edit backend/src/main/resources/application.properties
   ```
   Update the following properties:
   ```properties
   firebase.project-id=your-firebase-project-id
   firebase.credentials.path=classpath:firebase-service-account.json
   ```

4. **Build the project:**
   ```bash
   mvn clean install
   ```

5. **Run the Spring Boot application:**
   ```bash
   mvn spring-boot:run
   ```
   
   Or run the JAR file directly:
   ```bash
   java -jar target/scheduling-system-0.0.1-SNAPSHOT.jar
   ```

The backend will be available at `http://localhost:8080`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase (if not already configured):**
   - Update `src/firebase/config.js` with your Firebase project credentials
   - Get credentials from Firebase Console → Project Settings → General → Your apps

3. **Start the development server:**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## Deployment Instructions

### Backend Deployment

#### Option 1: Deploy as JAR File

1. **Build the production JAR:**
   ```bash
   cd backend
   mvn clean package -DskipTests
   ```
   This creates `target/scheduling-system-0.0.1-SNAPSHOT.jar`

2. **Configure production database:**
   Update `application.properties` or use environment variables:
   ```properties
   # For MySQL/PostgreSQL
   spring.datasource.url=jdbc:mysql://localhost:3306/scheduling_system
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
   spring.jpa.hibernate.ddl-auto=update
   ```

3. **Set environment variables (recommended):**
   ```bash
   export SPRING_DATASOURCE_URL=jdbc:mysql://your-db-host:3306/scheduling_system
   export SPRING_DATASOURCE_USERNAME=your_username
   export SPRING_DATASOURCE_PASSWORD=your_password
   export FIREBASE_PROJECT_ID=your-firebase-project-id
   ```

4. **Run the JAR:**
   ```bash
   java -jar -Dspring.profiles.active=production target/scheduling-system-0.0.1-SNAPSHOT.jar
   ```

#### Option 2: Deploy to Cloud Platforms

**Heroku:**
```bash
# Install Heroku CLI
heroku create your-app-name
heroku config:set SPRING_DATASOURCE_URL=your-database-url
heroku config:set FIREBASE_PROJECT_ID=your-project-id
git push heroku main
```

**AWS Elastic Beanstalk:**
```bash
# Install EB CLI
eb init -p java-17 scheduling-system
eb create scheduling-system-env
eb deploy
```

**Docker:**
```dockerfile
# Create Dockerfile in backend directory
FROM openjdk:17-jdk-slim
COPY target/scheduling-system-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

```bash
docker build -t scheduling-system-backend .
docker run -p 8080:8080 scheduling-system-backend
```

#### Production Configuration Checklist

- [ ] Update database configuration (MySQL/PostgreSQL)
- [ ] Set `spring.jpa.hibernate.ddl-auto=update` (not `create-drop`)
- [ ] Configure CORS for production frontend URL
- [ ] Set up Firebase service account credentials
- [ ] Configure logging (logback.xml)
- [ ] Set up monitoring and health checks
- [ ] Configure SSL/TLS certificates
- [ ] Set up reverse proxy (Nginx/Apache) if needed

### Frontend Deployment

#### Option 1: Build Static Files

1. **Build for production:**
   ```bash
   npm run build
   ```
   This creates an optimized `build/` directory

2. **Serve static files:**
   - Copy `build/` contents to your web server
   - Configure server to serve `index.html` for all routes (SPA routing)

#### Option 2: Deploy to Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting:**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to `build`
   - Configure as single-page app: Yes
   - Set up automatic builds: Yes (optional)

4. **Build and deploy:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

#### Option 3: Deploy to Other Platforms

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=build
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
npm run build
vercel --prod
```

**AWS S3 + CloudFront:**
```bash
# Build
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Option 4: Docker Deployment

```dockerfile
# Create Dockerfile in root directory
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t scheduling-system-frontend .
docker run -p 80:80 scheduling-system-frontend
```

#### Frontend Environment Configuration

Create `.env.production` file in the root directory:
```env
REACT_APP_API_URL=https://your-backend-api.com
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

**Important:** Update the API base URL in `src/services/api.js` or `src/services/backendApi.js` to point to your production backend URL.

For development, create `.env.development`:
```env
REACT_APP_API_URL=http://localhost:8080
```

#### Production Configuration Checklist

- [ ] Update API endpoints to production backend URL
- [ ] Configure Firebase production project
- [ ] Set up environment variables
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS on backend for production domain
- [ ] Set up CDN for static assets (optional)
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up analytics (Google Analytics, etc.)
- [ ] Test all features in production environment

## API Endpoints

### Classrooms
- `GET /api/classrooms` - Get all classrooms
- `POST /api/classrooms` - Create a new classroom
- `PUT /api/classrooms/{id}` - Update a classroom
- `DELETE /api/classrooms/{id}` - Delete a classroom

### Teachers
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create a new teacher
- `PUT /api/teachers/{id}` - Update a teacher
- `DELETE /api/teachers/{id}` - Delete a teacher

### Schedules
- `GET /api/schedules` - Get all schedules
- `POST /api/schedules` - Create a new schedule
- `POST /api/schedules/generate` - Generate conflict-free schedules
- `GET /api/schedules/statistics` - Get scheduling statistics

## How to Use

1. **Add Classrooms**: Navigate to the Classrooms section and add all available classrooms with their types and capacities.

2. **Add Teachers**: Go to the Teachers section and add teacher information including:
   - Personal details
   - Subject expertise
   - Available days and time slots
   - Contact information

3. **Generate Schedules**: 
   - Go to the Schedule Generator
   - Add scheduling requests with required details:
     - Time slots
     - Days of the week
     - Subject requirements
     - Classroom type and capacity needs
   - Click "Generate Conflict-Free Schedule" for automatic scheduling

4. **Review and Manage**: View generated schedules in the Schedules section and make adjustments as needed.

## Scheduling Algorithm

The system uses an advanced conflict-free scheduling algorithm that:

1. **Validates Teacher Availability**: Checks if teachers are available during requested time slots
2. **Matches Classroom Requirements**: Ensures classrooms meet capacity and type requirements
3. **Prevents Double Booking**: Prevents teachers and classrooms from being scheduled simultaneously
4. **Optimizes Resource Usage**: Maximizes utilization of available resources
5. **Handles Recurring Schedules**: Supports weekly recurring schedule patterns

## Configuration

### Backend Configuration

#### Database Configuration

**Development (H2 - In-Memory):**
```properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.jpa.hibernate.ddl-auto=create-drop
```

**Production (MySQL):**
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/scheduling_system
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
spring.jpa.hibernate.ddl-auto=update
```

**Production (PostgreSQL):**
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/scheduling_system
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update
```

#### CORS Configuration

Update CORS settings in `application.properties` for production:
```properties
spring.web.cors.allowed-origins=https://your-frontend-domain.com
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
spring.web.cors.allow-credentials=true
```

### Frontend Configuration

#### API Endpoint Configuration

Update the backend API URL in:
- `src/services/api.js` - Main API service
- `src/services/backendApi.js` - Backend API service

Or use environment variables:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
```

#### Firebase Configuration

Update `src/firebase/config.js` with your Firebase project credentials:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Development

### Running Tests
```bash
# Backend tests
cd backend
mvn test

# Frontend tests
npm test
```

### Building for Production
```bash
# Backend
cd backend
mvn clean package

# Frontend
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Quick Deployment Reference

### Backend Quick Deploy
```bash
cd backend
mvn clean package -DskipTests
java -jar target/scheduling-system-0.0.1-SNAPSHOT.jar
```

### Frontend Quick Deploy
```bash
npm run build
# Deploy build/ directory to your web server
```

### Environment Variables Summary

**Backend:**
- `SPRING_DATASOURCE_URL` - Database connection URL
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `SERVER_PORT` - Server port (default: 8080)

**Frontend:**
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_FIREBASE_*` - Firebase configuration variables

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change port in application.properties
server.port=8081
```

**Database connection errors:**
- Verify database credentials
- Ensure database server is running
- Check firewall settings

**Firebase authentication errors:**
- Verify service account JSON file is in correct location
- Check Firebase project ID matches
- Ensure service account has proper permissions

### Frontend Issues

**API connection errors:**
- Verify backend is running
- Check CORS configuration on backend
- Verify API URL in environment variables

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Firebase errors:**
- Verify Firebase config in `src/firebase/config.js`
- Check Firebase project settings
- Ensure Firebase services are enabled

## Support

For support and questions, please open an issue in the repository or contact the development team.