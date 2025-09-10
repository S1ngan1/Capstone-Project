# Agent Development Guide - Smart Farm Monitoring System

## 📱 Project Overview

### Purpose & Mission
This is a **Smart Farm Monitoring System** designed specifically for Vietnamese farmers with **zero experience** in mobile applications for agricultural analysis. The primary goal is to provide an intuitive, user-friendly interface that makes complex sensor data and farm management accessible to non-technical users.

### Target Audience
- Vietnamese farmers (primary users)
- Farm managers with limited technical background
- Agricultural cooperatives
- Users who are more familiar with popular social media apps than technical applications

### Core Functionality
- Real-time sensor data monitoring (pH, EC, soil moisture, temperature)
- Multi-farm management with role-based access
- Weather integration for location-specific conditions
- Farm member management and collaboration
- Automated suggestions for crop improvement
- Simple, visual data representation

---

## 🎯 Design Philosophy & UI/UX Principles

### 1. **Simplicity First**
- **Rule**: Every screen should have ONE primary action that's immediately obvious
- **Implementation**: Large, clear buttons with icons and text
- **Example**: "Add Farm" button should be prominent and unmistakable

### 2. **Familiar Interface Patterns**
- **Rule**: Use UI patterns similar to popular Vietnamese apps (Zalo, Facebook, Shopee)
- **Implementation**: Bottom navigation, card-based layouts, familiar icons
- **Colors**: Green-based theme representing agriculture and growth

### 3. **Visual Communication Over Text**
- **Rule**: Use colors, icons, and visual indicators before text explanations
- **Implementation**: 
  - Green = Good/Safe
  - Yellow = Moderate/Warning
  - Red = Critical/Danger
  - Clear status indicators for all sensor readings

### 4. **Touch-Friendly Design**
- **Rule**: All interactive elements must be at least 44px tap target
- **Implementation**: Large buttons, adequate spacing, easy-to-tap areas

---

## 🏗️ Technical Architecture Guidelines

### Database Schema (Supabase)
```
Users (profiles table)
├── id (UUID)
├── username (text)
├── email (text)
├── role (text) - app-level role (admin, user, data_manager)
└── farm_creation_status (text)

Farms
├── id (UUID)
├── name (text)
├── location (text) - Vietnamese province
├── farm_image (text)
└── created_at (timestamp)

Farm_Users (Junction Table)
├── farm_id (UUID) → Farms
├── user_id (UUID) → Users
└── farm_role (text) - farm-specific role (owner, manager, viewer)

Sensors
├── sensor_id (text)
├── sensor_name (text)
├── sensor_type (text)
├── farm_id (UUID) → Farms
├── model (text)
├── units (text)
├── status (text)
└── notes (text)

Sensor_Data
├── id (text)
├── created_at (timestamp)
├── value (float)
└── sensor_id (text) → Sensors
```

### Navigation Structure
```
Bottom Navigation:
├── Home - Farm overview, quick stats
├── Farm - Detailed farm management
├── Notification - System alerts
└── Suggestion - AI-powered recommendations

Modal/Screens:
├── FarmDetails - Individual farm analysis
├── SensorDetail - Specific sensor information
├── UserDetail - User management
├── Settings - App configuration
└── Auth - Login/Signup
```

---

## 🔧 Development Rules & Validation Checklist

### Before Adding New Features/Files

#### 1. **Compatibility Check**
- [ ] Does this feature integrate with existing navigation?
- [ ] Are all imports and dependencies correctly resolved?
- [ ] Does it follow the established color scheme and styling?
- [ ] Is it consistent with existing UI components?

#### 2. **User Experience Validation**
- [ ] Can a non-technical farmer understand this feature in 5 seconds?
- [ ] Does it follow the "one primary action per screen" rule?
- [ ] Are error messages clear and actionable in simple language?
- [ ] Is the touch target size adequate (minimum 44px)?

#### 3. **Data Integration Check**
- [ ] Does it properly fetch real data from Supabase?
- [ ] Are all database queries optimized and error-handled?
- [ ] Does it gracefully handle loading states?
- [ ] Are mock data completely replaced with real data?

#### 4. **Code Quality Standards**
- [ ] All TypeScript types properly defined
- [ ] Error boundaries implemented for crash prevention
- [ ] Loading states and error states handled
- [ ] No console.log statements in production code
- [ ] Proper component organization and reusability

### Mandatory Testing Checklist

#### Before Each Commit:
1. **Functionality Test**
   - [ ] Feature works as intended
   - [ ] No runtime errors or crashes
   - [ ] All user interactions respond correctly

2. **Integration Test**
   - [ ] Navigation flows work seamlessly
   - [ ] Data displays correctly across different screens
   - [ ] User roles and permissions respected

3. **UI/UX Test**
   - [ ] Responsive design on different screen sizes
   - [ ] Colors and typography consistent
   - [ ] Accessibility considerations met

---

## 📋 Component Guidelines

### 1. **Reusable Components**
Always check if similar functionality exists before creating new components:
- `WeatherWidget` - for weather displays
- `SensorDataTable` - for sensor data visualization
- `BottomNavigation` - consistent navigation
- `LinearGradient` - for visual appeal

### 2. **Styling Standards**
```typescript
// Use consistent color palette
const colors = {
  primary: '#4CAF50',      // Green for primary actions
  secondary: '#2196F3',    // Blue for secondary elements
  warning: '#FF9800',      // Orange for warnings
  danger: '#F44336',       // Red for critical states
  success: '#4CAF50',      // Green for success states
  background: '#F5F5F5',   // Light gray background
  white: '#FFFFFF',
  text: '#333333'
};

// Consistent spacing
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};
```

### 3. **Error Handling Standards**
```typescript
// Always implement proper error handling
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  console.error('Descriptive error message:', error);
  // Show user-friendly error message
  Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
}
```

---

## 🌐 Localization & Content Guidelines

### Language Considerations
- **Primary**: Vietnamese (farmer-friendly language)
- **Secondary**: English (for technical terms when necessary)
- **Rule**: Always use simple, conversational Vietnamese
- **Avoid**: Technical jargon, complex terminology

### Content Writing Rules
1. **Brevity**: Maximum 2 lines of text per instruction
2. **Clarity**: Use everyday Vietnamese words
3. **Action-Oriented**: Tell users what to do, not what something is
4. **Positive Tone**: Encouraging and helpful, never intimidating

---

## 🔒 Security & Data Privacy

### User Data Protection
- All sensitive operations require authentication
- Farm data only accessible to authorized users
- Row-Level Security (RLS) implemented in Supabase
- No sensitive data stored in device logs

### API Security
- Weather API keys properly secured
- Supabase credentials managed through environment variables
- All database queries use parameterized statements

---

## 🚀 Performance Guidelines

### Optimization Rules
1. **Lazy Loading**: Implement for large datasets
2. **Caching**: Cache frequently accessed data (weather, sensor readings)
3. **Image Optimization**: Compress farm images appropriately
4. **Network Efficiency**: Batch API calls when possible

### Memory Management
- Properly cleanup useEffect hooks
- Avoid memory leaks in navigation
- Optimize large lists with FlatList
- Implement proper error boundaries

---

## 📞 Integration Points

### External Services
1. **Supabase Database**
   - Authentication
   - Data storage
   - Real-time subscriptions

2. **Weather API (OpenWeather)**
   - Current conditions
   - Forecast data
   - Location-based weather

3. **Navigation (React Navigation)**
   - Bottom tabs
   - Stack navigation
   - Modal presentations

### Key Integration Rules
- Always handle offline scenarios
- Implement proper loading states
- Graceful degradation when services unavailable
- User feedback for all async operations

---

## 🎯 Success Metrics

### User Experience Goals
- **Onboarding**: New user should complete first farm setup in under 3 minutes
- **Daily Usage**: Quick sensor check should take less than 30 seconds
- **Error Rate**: Less than 1% of user actions should result in errors
- **Accessibility**: App should be usable by users 50+ years old

### Technical Performance Goals
- **Load Time**: Initial app load under 3 seconds
- **Response Time**: Database queries under 1 second
- **Crash Rate**: Less than 0.1% session crash rate
- **Battery Usage**: Minimal background processing

---

## 🔄 Continuous Improvement Process

### Regular Review Points
1. **Weekly**: UI/UX consistency check
2. **Bi-weekly**: Performance monitoring
3. **Monthly**: User feedback integration
4. **Quarterly**: Feature usage analysis

### Feedback Integration
- Monitor user interaction patterns
- A/B test new features with small user groups
- Regular accessibility audits
- Performance benchmarking

---

**Remember**: This application serves farmers who trust it with their livelihood. Every feature should be reliable, intuitive, and respectful of their time and expertise in agriculture, even if they're new to technology.
