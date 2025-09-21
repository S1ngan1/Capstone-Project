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

### 5. **Perfect Grid Layout Pattern** ⭐
- **Rule**: When displaying multiple objects/cards, use balanced grid layouts with equal area distribution
- **Implementation**: 50/50 split layouts, 2x2 grids, responsive sizing
- **Example**: Weather card = 4 sensor panels total area (including gaps)

---

## 📐 **PERFECT GRID LAYOUT SYSTEM** ⭐
**⚠️ CRITICAL PATTERN: Use this layout whenever displaying multiple objects or cards**

### **Core Principle: Equal Area Distribution**
When you have multiple UI elements to display (cards, panels, widgets), divide them into balanced grids where:
- **Total areas are equal** between major sections
- **Visual weight is balanced** across the layout
- **Responsive design** works on all device sizes
- **Perfect alignment** with consistent spacing

### **Pattern 1: 50/50 Side-by-Side Layout**
**Perfect for:** Main content + supporting content (like Weather + Sensors)

```typescript
// Layout Structure Example from Home.tsx
const styles = StyleSheet.create({
  dataContainer: {
    flexDirection: 'row',
    gap: responsiveMargin,
    minHeight: 140, // Consistent base height
    alignItems: 'stretch', // Both sides stretch equally
  },
  leftSide: {
    flex: 1, // Exactly 50% width
    minHeight: 140,
    maxHeight: 140, // Prevent expansion
  },
  rightSide: {
    flex: 1, // Exactly 50% width  
    minHeight: 140,
    maxHeight: 140, // Match left side exactly
  }
})
```

**Key Implementation Rules:**
1. **Equal Flex Values**: Both sides must have `flex: 1`
2. **Matching Heights**: `minHeight` and `maxHeight` must be identical
3. **Stretch Alignment**: Use `alignItems: 'stretch'` on container
4. **Consistent Gap**: Use `gap: responsiveMargin` for spacing

### **Pattern 2: 2x2 Grid Layout** 
**Perfect for:** Multiple similar objects (sensors, status panels, quick actions)

```typescript
// Grid Implementation Example
const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isSmallDevice ? 4 : 6,
    flex: 1,
    justifyContent: 'space-between', // Even distribution
    alignContent: 'flex-start',
    height: isSmallDevice ? 110 : 120, // Fixed height for grid
  },
  gridItem: {
    width: '47%', // Exact percentage for 2x2 with gap
    height: isSmallDevice ? 50 : 55, // Consistent item height
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: isSmallDevice ? 4 : 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: isSmallDevice ? 4 : 6, // Row spacing
  }
})
```

**Key Implementation Rules:**
1. **Exact Percentages**: Use `width: '47%'` for 2x2 grid (allows 6% for gaps)
2. **Fixed Heights**: Set specific `height` values for consistency
3. **Space-Between**: Use `justifyContent: 'space-between'` for even distribution
4. **Responsive Sizing**: Different values for `isSmallDevice` vs normal

### **Pattern 3: Responsive Component Sizing**
**Perfect for:** Components that need to fill allocated space exactly

```typescript
// Component Styling Example (WeatherWidget compact mode)
const styles = StyleSheet.create({
  responsiveContainer: {
    flex: 1, // Take full available space
    height: '100%', // Fill parent height exactly
    minHeight: 120, // Match grid counterparts
    borderRadius: 12,
    overflow: 'hidden',
  },
  responsiveContent: {
    flex: 1, // Fill available space
    padding: 8, // Compact padding
    justifyContent: 'center', // Center content vertically
  },
  responsiveLayout: {
    flexDirection: 'column', // Stack vertically for space efficiency
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  }
})
```

**Key Implementation Rules:**
1. **Full Flex**: Use `flex: 1` to take all available space
2. **Height Matching**: Use `height: '100%'` to fill parent exactly  
3. **Center Content**: Use `justifyContent: 'center'` for optimal alignment
4. **Compact Spacing**: Reduce padding/margins in tight spaces

### **📱 Responsive Design Requirements**

```typescript
// Always include responsive calculations
const { width, height } = Dimensions.get('window')
const isSmallDevice = width < 350 || height < 600
const isMediumDevice = width < 400 || height < 700
const responsivePadding = isSmallDevice ? 12 : 16
const responsiveMargin = isSmallDevice ? 8 : 12

// Use in all grid layouts
const responsiveFontSize = {
  title: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
  content: isSmallDevice ? 14 : 16,
  small: isSmallDevice ? 10 : 12,
}
```

### **✅ Perfect Grid Layout Checklist**
Before implementing any multi-object layout, ensure:

- [ ] **Equal Areas**: Total area of left side = total area of right side
- [ ] **Consistent Heights**: All major sections have matching `minHeight` and `maxHeight`
- [ ] **Responsive Values**: Different sizing for `isSmallDevice`, `isMediumDevice`, normal
- [ ] **Proper Flex**: Use `flex: 1` for equal distribution
- [ ] **Stretch Alignment**: Container uses `alignItems: 'stretch'`  
- [ ] **Gap Consistency**: Use `gap: responsiveMargin` throughout
- [ ] **Grid Percentages**: 2x2 grids use `width: '47%'` for perfect fit
- [ ] **Content Centering**: Components use `justifyContent: 'center'` when appropriate
- [ ] **Visual Balance**: Both sides have similar visual weight and importance

### **🎯 Real-World Example: Farm Card Layout**
```typescript
// Perfect implementation from Home.tsx
<View style={styles.dataContainer}> {/* 50/50 container */}
  {/* Left Side: Weather Widget - takes exactly 50% */}
  <View style={styles.weatherSide}>
    <Text style={styles.weatherSectionTitle}>🌤️ Weather</Text>
    <WeatherWidget location={location} compact={true} />
  </View>
  
  {/* Right Side: 4 Sensors in 2x2 Grid - takes exactly 50% */}
  <View style={styles.sensorSide}>
    <Text style={styles.sensorSectionTitle}>📊 Sensors</Text>
    <View style={styles.sensorGrid}>
      {sensorData.map(sensor => (
        <View key={sensor.type} style={styles.sensorPanel}>
          {/* Sensor content */}
        </View>
      ))}
    </View>
  </View>
</View>
```

**Result**: Weather widget area = Total area of 4 sensor panels (including gaps) ✅

---
