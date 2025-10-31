# 🏫 School Management System

A comprehensive, production-ready school management system built with FastAPI, featuring advanced scheduling algorithms, universal search, backup system, and Telegram notifications.

## 🌟 Features

### Core Modules
- **👨‍🎓 Student Management**: Complete student profiles, enrollment, academic records
- **👨‍🏫 Teacher Management**: Teacher profiles, subjects, salary management
- **📚 Academic Management**: Academic years, classes, subjects, schedules
- **💰 Finance Management**: Student payments, teacher salaries, financial tracking
- **🎯 Activities Management**: Extracurricular activities and events
- **🔐 Authentication**: JWT-based authentication with role-based access control

### Advanced Features
- **📅 AI-Powered Schedule Generation**: Genetic algorithm optimization for optimal class scheduling
- **🔍 Universal Search**: Arabic text processing with fuzzy matching across all modules
- **💾 Comprehensive Backup System**: Automated database and file backups
- **📱 Telegram Notifications**: Real-time notifications for important events
- **📊 System Monitoring**: Performance metrics and health monitoring
- **🌐 RESTful API**: Complete REST API with OpenAPI documentation

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Virtual Environment (recommended)

### Installation

1. **Clone and setup environment:**
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
# Copy and edit .env file
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the server:**
```bash
python app/main.py
```

5. **Access the system:**
- API Documentation: http://localhost:8000/docs
- Default admin login: `admin` / `admin123`

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/                 # API endpoints
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── students.py     # Student management API
│   │   ├── teachers.py     # Teacher management API
│   │   ├── finance.py      # Finance management API
│   │   ├── activities.py   # Activities API
│   │   ├── schedules.py    # Schedule management API
│   │   ├── search.py       # Universal search API
│   │   └── system.py       # System management API
│   │
│   ├── models/             # Database models
│   │   ├── students.py     # Student data models
│   │   ├── teachers.py     # Teacher data models
│   │   ├── academic.py     # Academic structure models
│   │   ├── finance.py      # Finance models
│   │   ├── activities.py   # Activity models
│   │   ├── schedules.py    # Schedule models
│   │   ├── users.py        # User authentication models
│   │   └── system.py       # System models
│   │
│   ├── schemas/            # Pydantic schemas
│   │   ├── students.py     # Student API schemas
│   │   ├── search.py       # Search API schemas
│   │   └── system.py       # System API schemas
│   │
│   ├── services/           # Business logic services
│   │   ├── search_service.py      # Universal search engine
│   │   ├── schedule_service.py    # Schedule generation
│   │   ├── schedule_optimizer.py  # AI optimization algorithms
│   │   ├── backup_service.py      # Backup management
│   │   ├── telegram_service.py    # Telegram notifications
│   │   └── monitoring_service.py  # System monitoring
│   │
│   ├── core/               # Core functionality
│   │   └── dependencies.py # Dependency injection
│   │
│   ├── utils/              # Utility functions
│   │   └── security.py     # Security utilities
│   │
│   ├── config.py           # Configuration management
│   ├── database.py         # Database connection
│   └── main.py             # Application entry point
│
├── uploads/                # File uploads directory
├── backups/                # Backup files directory
├── requirements.txt        # Python dependencies
├── .env.example           # Environment configuration template
└── simple_test.py         # Basic system test
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Database
DATABASE_URL=sqlite:///./school_management.db

# Security
SECRET_KEY=your_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Server
HOST=0.0.0.0
PORT=8000

# Directories
UPLOAD_DIRECTORY=./uploads
BACKUP_DIRECTORY=./backups

# Telegram (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user info

### Students
- `GET /api/students/` - List students
- `POST /api/students/` - Create student
- `GET /api/students/{id}` - Get student details
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student

### Search
- `GET /api/search/universal` - Universal search across all modules
- `GET /api/search/quick` - Quick search for autocomplete
- `GET /api/search/students` - Search students only
- `GET /api/search/teachers` - Search teachers only

### System Management
- `POST /api/system/backup/database` - Create database backup
- `POST /api/system/backup/full` - Create full system backup
- `GET /api/system/backup/list` - List available backups
- `GET /api/system/status` - Get system status
- `POST /api/system/notification/send` - Send custom notification

### Schedules
- `POST /api/schedules/generate` - Generate optimized schedules
- `GET /api/schedules/` - List schedules
- `POST /api/schedules/` - Create schedule entry

## 🧠 Advanced Features

### AI-Powered Schedule Generation
The system uses genetic algorithms to generate optimal class schedules:

```python
# Example: Generate schedules for academic year
POST /api/schedules/generate
{
  "academic_year_id": 1,
  "session_type": "morning",
  "optimization_level": "high"
}
```

Features:
- **Genetic Algorithm Optimization**: Evolves schedules for optimal solutions
- **Constraint Management**: Handles teacher conflicts, room availability
- **Multi-objective Optimization**: Balances multiple scheduling criteria
- **Simulated Annealing**: Fine-tunes schedule quality

### Universal Search Engine
Advanced search capabilities with Arabic text processing:

```python
# Example: Search across all modules
GET /api/search/universal?query=محمد&scope=all&mode=fuzzy
```

Features:
- **Arabic Text Processing**: Diacritic removal and character normalization
- **Fuzzy Matching**: Finds similar results even with typos
- **Multi-scope Search**: Search specific modules or everything
- **Relevance Scoring**: Intelligent result ranking

### Backup System
Comprehensive backup solution:

```python
# Create full system backup
POST /api/system/backup/full
{
  "backup_name": "weekly_backup_2024"
}
```

Features:
- **Database Backups**: SQLite backup with metadata
- **File Backups**: Compressed archive of uploads
- **Full System Backups**: Complete system state
- **Automated Cleanup**: Removes old backups automatically

### Telegram Notifications
Real-time notifications for important events:

Features:
- **Authentication Alerts**: Login/logout notifications
- **Payment Notifications**: New payment alerts
- **System Alerts**: Performance and error notifications
- **Daily Summaries**: Automated daily reports

## 👥 User Roles

- **Director**: Full system access, user management, system configuration
- **Morning School**: Manage morning session students and activities
- **Evening School**: Manage evening session students and activities
- **Finance**: Access to financial data and payment management

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permission system
- **Password Security**: Strong password requirements and hashing
- **API Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Parameterized queries

## 📈 Performance

- **Database Optimization**: Indexed queries and efficient relationships
- **Async Operations**: Non-blocking I/O for better performance
- **Caching**: Strategic caching for frequently accessed data
- **Background Tasks**: Async processing for heavy operations
- **Memory Management**: Efficient resource utilization

## 🧪 Testing

Run the basic system test:
```bash
python simple_test.py
```

This verifies:
- ✅ All imports working correctly
- ✅ 92 API routes registered
- ✅ Core services initialized
- ✅ Database models loaded

## 🚀 Deployment

### Development
```bash
python app/main.py
```

### Production
```bash
# Using Gunicorn
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Using Docker (create Dockerfile)
docker build -t school-management .
docker run -p 8000:8000 school-management
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

The interactive documentation provides:
- Complete API reference
- Request/response examples
- Authentication testing
- Real-time API testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Future Enhancements

- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Detailed reporting and analytics dashboard
- **Email Integration**: Email notifications and communication
- **Parent Portal**: Parent access to student information
- **Online Payments**: Integration with payment gateways
- **Attendance System**: Biometric or RFID attendance tracking
- **Grade Management**: Comprehensive grading and transcript system
- **Library Management**: Book lending and inventory system

## 🆘 Support

For support and questions:
- Check the API documentation at `/docs`
- Review the code comments and examples
- Test with the provided test scripts

---

**Built with ❤️ for educational institutions worldwide**