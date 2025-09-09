// Example comprehensive test configuration
const testConfig = {
  notifications: [{
    componentName: 'NotificationCounter',
    hasRedBadge: true,
    counterPosition: 'top-right',
    maxDisplayCount: 99,
    shouldResetOnClick: true
  }],
  panels: [{
    componentName: 'FarmCard',
    weatherPanel: { height: 140, hasFixedHeight: true },
    sensorPanels: { count: 4, individualHeight: 60, spacing: 6, hasFixedHeight: true },
    layoutType: 'horizontal'
  }],
  syntax: {
    filePaths: ['screens/Home.tsx', 'components/NotificationCounter.tsx'],
    checkMissingSemicolons: true,
    checkUnmatchedBraces: true,
    checkUnexpectedTokens: true,
    checkImportExportErrors: true
  }

---

---

## 🔧 Development Workflow

### **Step-by-Step Process**

1. **Pre-Development Analysis**
   - Read requirements carefully
   - Identify all files that need modification
   - Run syntax validation on existing files
   - Document expected changes

2. **Implementation Phase**
   - Make incremental changes
   - Test each change individually
   - Run get_errors tool after each file modification
   - Fix syntax errors immediately

3. **UI Validation Phase**
   - Run uiTestingBot with appropriate configurations
   - Validate all affected components
   - Check notification counters, panel alignments, form UI
   - Ensure accessibility compliance

4. **Final Verification**
   - Run comprehensive syntax validation
   - Test user workflows end-to-end
   - Verify database integration
   - Check for memory leaks in subscriptions

### **Quality Gates**
- ✅ Zero syntax errors (critical)
- ✅ All notification counters functional (critical)
- ✅ Panel alignments correct (warning)
- ✅ Form UI accessible and usable (warning)
- ✅ Filter distributions equal (info)

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

## 🧪 UI Testing & Quality Assurance

### **MANDATORY TESTING PROTOCOL**
**⚠️ CRITICAL REQUIREMENT: Always run uiTestingBot before and after adding new functionality**

#### Pre-Development Testing
```typescript
// Before making any UI changes, run:
import { uiTestingBot } from './utils/uiTestingBot';

const preTestResults = await uiTestingBot.runComprehensiveTests({
  syntax: {
    filePaths: ['path/to/files/being/modified'],
    checkMissingSemicolons: true,
    checkUnmatchedBraces: true,
    checkUnexpectedTokens: true,
    checkImportExportErrors: true
  }
});

console.log('PRE-DEVELOPMENT REPORT:', uiTestingBot.generateReport());
```

#### Post-Development Testing
```typescript
// After completing changes, run full validation:
const postTestResults = await uiTestingBot.runComprehensiveTests({
  panels: [/* panel alignment configs */],
  lists: [/* list component configs */],
  components: [/* component structure configs */],
  notifications: [/* notification counter configs */],
  syntax: {
    filePaths: ['all/modified/files'],
    checkMissingSemicolons: true,
    checkUnmatchedBraces: true,
    checkUnexpectedTokens: true,
    checkImportExportErrors: true
  }
});

console.log('POST-DEVELOPMENT REPORT:', uiTestingBot.generateReport());
```

### **Testing Requirements by Component Type**

#### 1. Notification Systems
- **Red badge styling**: Background #FF3B30, white text, proper positioning
- **Counter reset**: Must reset to 0 when user views notifications
- **Real-time updates**: Subscribe to database changes
- **99+ display**: Show "99+" when count exceeds 99

#### 2. Panel Alignments (Farm Cards)
- **Weather panel height**: Must equal total sensor grid height including spacing
- **Fixed heights**: All panels must have consistent, fixed heights
- **Responsive layout**: Proper alignment across different screen sizes

#### 3. Filter Bars & Lists
- **Equal distribution**: Filter buttons must be equally spaced
- **Count badges**: Show accurate counts for each filter state
- **Active state styling**: Clear visual indication of selected filter

#### 4. Form UI Elements
- **Required field indicators**: Red asterisk (*) before required fields
- **Edit button visibility**: Must be clearly visible and accessible
- **Gradient styling**: Use LinearGradient for primary action buttons
- **Delete confirmations**: Require text input for destructive actions

#### 5. Syntax Validation
- **Import statements**: Must be at top of file, proper syntax
- **Brace matching**: All opening braces must have closing braces
- **Export statements**: Proper TypeScript export syntax
- **Missing semicolons**: Critical syntax errors must be caught

### **Error Prevention Strategy**

#### Common Issues to Test For:
1. **Duplicate keys in FlatList components**
2. **Missing loading states for async operations**
3. **Unmatched JSX braces or parentheses**
4. **Import/export statement placement errors**
5. **Missing accessibility labels**
6. **Inconsistent panel heights in farm cards**
7. **Filter button sizing and distribution**
8. **Notification counter reset functionality**

- **Test Coverage:** All interactive components must have UI tests

### **Integration with Development Workflow**

```typescript
// Example: Adding UITestingBot to your component development
export const YourNewComponent = () => {
  // Your component implementation
  
  // Development-time testing (remove in production)
  useEffect(() => {
    if (__DEV__) {
      const testResults = uiTestingBot.testFormUI({
        componentName: 'YourNewComponent',
        requiredFields: ['name', 'email'],
        hasRequiredIndicators: true,
        hasEditMode: true,
        hasVisibleEditButton: true,
        editButtonSize: 24,
        hasGradientButtons: true
      });
      
      if (testResults.some(r => r.severity === 'critical')) {
        console.warn('🔴 Critical UI issues detected:', testResults);
      }
    }
  }, []);
  
  return (
    // Your JSX
  );
};
```

---

## 📝 Farm Notes Display Requirements

### **Farm Notes Feature Specification**
The FarmDetails screen MUST display farm notes prominently to provide context for both users and AI suggestions.

#### **Positioning Requirements**
- **Location**: Top of FarmDetails screen, immediately after header
- **Priority**: Display BEFORE weather widget for maximum visibility
- **Visibility**: Only show when farm has notes (hide section if notes are null/empty)

#### **Styling Requirements**
- **Container**: White card with shadow and rounded corners
- **Visual Accent**: Green left border (4px width) to match app theme
- **Header**: Document icon + "🌱 About This Farm" title
- **Text Style**: Italicized notes text for better readability
- **Typography**: 15px font size, 22px line height, #333 color

#### **AI Integration Indicator**
- **Purpose**: Explain how farm notes help AI provide better suggestions
- **Design**: Brain icon + explanatory text in highlighted box
- **Background**: Light red/pink background with border
- **Text**: "This information helps AI provide better suggestions for your farm"

#### **Database Integration**
- **Table**: `farms` table
- **Column**: `notes` field (text type)
- **Fetching**: Include in farm details query: `SELECT id, name, location, notes FROM farms`

#### **Implementation Example**
```typescript
// Farm Notes Section in FarmDetails.tsx
{farm?.notes && (
  <View style={styles.farmNotesSection}>
    <View style={styles.farmNotesHeader}>
      <Ionicons name="document-text" size={20} color="#4CAF50" />
      <Text style={styles.farmNotesTitle}>🌱 About This Farm</Text>
    </View>
    <View style={styles.farmNotesCard}>
      <Text style={styles.farmNotesText}>{farm.notes}</Text>
      <View style={styles.aiIndicator}>
        <Ionicons name="brain" size={16} color="#FF6B6B" />
        <Text style={styles.aiIndicatorText}>
          This information helps AI provide better suggestions for your farm
        </Text>
      </View>
    </View>
  </View>
)}
```

#### **Validation Testing**
- **Test Script**: Use `scripts/validateFarmNotes.ts` for comprehensive validation
- **UI Bot Test**: Run `uiTestingBot.testFarmNotesDisplay()` to verify implementation
- **Requirements Check**: Positioning, styling, AI indicator, empty state handling

---

## 🔧 Component Structure Requirements
```
#### Automated Checks:
│   ├── "🌱 About This Farm" title

### File Organization
```
src/
├── components/
│   ├── FarmCard.tsx
│   ├── WeatherWidget.tsx
│   ├── SensorGrid.tsx
│   └── FarmNotes.tsx
├── screens/
│   ├── HomeScreen.tsx
│   ├── FarmDetails.tsx
│   └── UserProfile.tsx
├── styles/
│   ├── colors.ts
│   ├── typography.ts
│   └── globalStyles.ts
└── utils/
    ├── api.ts
    ├── helpers.ts
    └── uiTestingBot.ts
```

---

## 📋 Specific Implementation Guidelines

### Farm Request System Implementation
The app now uses a **farm request system** instead of direct farm creation:

1. **User Flow**: Request → Admin Approval → Farm Access
2. **Role Management**: App-level roles (admin, user) + Farm-level roles (owner, manager, viewer)
3. **Components Required**:
   - `CreateFarmRequest.tsx` - Request form
   - `UserFarmRequests.tsx` - User's request history
   - `AdminFarmRequests.tsx` - Admin approval panel

### Data Fetching Patterns
```typescript
// Always include error handling and loading states
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('table').select('*');
    if (error) throw error;
    setData(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### Sensor Data Handling
```typescript
// Differentiate between "no sensor" vs "no data"
interface SensorData {
  hasSensor: boolean; // Sensor exists in database
  hasData: boolean;   // Recent data available
  value: number;
  status: 'normal' | 'warning' | 'critical';
}

// Display logic:
// hasSensor = false → "No sensor"
// hasSensor = true, hasData = false → "No data"
// hasSensor = true, hasData = true → Show actual value
```

---

## 🚀 Deployment & Quality Assurance

### Pre-Deployment Checklist
- [ ] All UITestingBot tests pass
- [ ] No TypeScript errors or warnings
- [ ] All forms validate user input properly
- [ ] Error boundaries catch and display errors gracefully
- [ ] Loading states present for all async operations
- [ ] Vietnamese text and UI patterns followed
- [ ] Farm request system fully functional
- [ ] Role-based access control working
- [ ] Weather widget responsive and accurate
- [ ] Sensor data displays correctly across all states

### Performance Standards
- [ ] App starts in under 3 seconds
- [ ] Navigation transitions smooth (no lag)
- [ ] Image loading optimized with placeholders
- [ ] Database queries cached where appropriate
- [ ] Minimal re-renders on state changes

---

## 📞 Emergency Debugging Guide

### Common Issues & Solutions

1. **"Unable to resolve module" errors**
   - Check import paths are correct
   - Ensure all dependencies installed
   - Restart Metro bundler

2. **Supabase connection issues**
   - Verify API keys in lib/supabase.ts
   - Check network connectivity
   - Validate database permissions

3. **Navigation crashes**
   - Verify all screen names in App.tsx match navigation calls
   - Check for missing screen parameters
   - Ensure proper TypeScript types for navigation

4. **UI layout issues**
   - Run UITestingBot for automated detection
   - Check StyleSheet consistency
   - Validate responsive design breakpoints

### UITestingBot Error Resolution
When UITestingBot reports issues:
1. **Critical Issues**: Fix immediately, block deployment
2. **Warning Issues**: Fix before next release
3. **Info Issues**: Address during next refactoring cycle

Remember: **Every UI fix should be validated with UITestingBot to prevent regression.**

---

This guide ensures consistent, user-friendly development that serves Vietnamese farmers effectively while maintaining high code quality and preventing UI regressions.
