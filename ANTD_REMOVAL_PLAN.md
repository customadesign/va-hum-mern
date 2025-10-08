# Ant Design Removal Plan

## Overview
Removing Ant Design from the admin frontend to eliminate styling conflicts and gain full control over the UI.

## Components to Replace

### High Priority (Core Layout)
1. **ConfigProvider** (App.js) → Remove, use ThemeContext only
2. **Dropdown** → Custom dropdown with Tailwind
3. **Avatar** → Custom avatar component
4. **Badge** → Custom badge component
5. **Tooltip** → Custom tooltip or use React-Tooltip

### Form Components
1. **Form** → React Hook Form or custom form
2. **Input** → Custom input with Tailwind
3. **Button** → Already have admin-button classes
4. **Select** → Custom select or React-Select
5. **Switch** → Custom toggle switch

### Display Components
1. **Card** → Custom card with Tailwind
2. **Modal** → Custom modal or React-Modal
3. **Spin** → Custom loading spinner
4. **Empty** → Custom empty state
5. **Tag** → Custom tag component

### Data Display
1. **Table** → Custom table or TanStack Table
2. **List** → Custom list component
3. **Statistic** → Custom stat cards
4. **Progress** → Custom progress bar

### Feedback
1. **message** → React-Toastify or custom toast
2. **notification** → Custom notification system
3. **Alert** → Custom alert component

## Migration Steps

### Phase 1: Core Components (Immediate)
1. Remove ConfigProvider and Ant theme
2. Replace Dropdown with custom dropdown
3. Replace Avatar with custom component
4. Replace Badge with custom component
5. Replace Tooltip with custom solution

### Phase 2: Form Components
1. Replace all Form/Input components
2. Update validation to use React Hook Form
3. Replace Select components
4. Replace Switch components

### Phase 3: Display Components
1. Replace all Card components
2. Replace Modal components
3. Replace Spin/Loading components
4. Replace Empty states

### Phase 4: Cleanup
1. Remove antd from package.json
2. Remove all Ant Design CSS imports
3. Remove theme.js configuration
4. Clean up unused CSS overrides

## Alternative Libraries (if needed)
- **Forms**: React Hook Form
- **Tables**: TanStack Table (React Table v8)
- **Modals**: React-Modal
- **Toasts**: React-Toastify
- **Tooltips**: React-Tooltip
- **Select**: React-Select
- **Date Picker**: React-Datepicker

## Benefits After Removal
✅ Full control over styling
✅ No more CSS conflicts
✅ Smaller bundle size
✅ Consistent dark theme
✅ Better performance
✅ Easier maintenance