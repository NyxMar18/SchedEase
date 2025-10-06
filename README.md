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
- React 19.0.0
- Material-UI (MUI) 6.4.7
- React Router 6.20.1
- Axios for API calls
- Day.js for date handling

### Backend
- Spring Boot 3.2.0
- Spring Data JPA
- H2 Database (development)
- Firebase Admin SDK
- Java 17

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Java 17
- Maven 3.6+
- Firebase project with service account

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a Firebase service account key:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate a new private key
   - Save it as `firebase-service-account.json` in `backend/src/main/resources/`

3. Update the Firebase configuration in `application.properties`:
   ```properties
   firebase.project-id=your-firebase-project-id
   ```

4. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```

The backend will be available at `http://localhost:8080`

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

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

### Database
The system uses H2 in-memory database for development. For production, update the database configuration in `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/scheduling_system
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### Firebase Integration
To enable Firebase integration:

1. Add your Firebase project ID to `application.properties`
2. Place your service account key in the resources directory
3. Uncomment Firebase-related code in the controllers and services

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

## Support

For support and questions, please open an issue in the repository or contact the development team.