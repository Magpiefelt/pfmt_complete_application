#!/bin/bash

# Fix UI component imports to use the index file
files=(
  "src/components/AppContent.vue"
  "src/components/dashboard/EnhancedProjectDashboard.vue"
  "src/components/financial/ApprovalHistoryTracker.vue"
  "src/components/financial/BudgetTransferLedger.vue"
  "src/components/financial/ContractPaymentsManager.vue"
  "src/components/financial/FinancialAnalytics.vue"
  "src/components/financial/Phase1ReportingDashboard.vue"
  "src/components/financial/SavedReportsManager.vue"
  "src/components/project-detail/BudgetTab.vue"
  "src/components/project-detail/DetailsTab.vue"
  "src/components/project-detail/LocationTab.vue"
  "src/components/project-detail/OverviewTab.vue"
  "src/components/project-detail/ProjectHeader.vue"
  "src/components/project-detail/ReportsTab.vue"
  "src/components/project-detail/TeamTab.vue"
  "src/components/project-detail/VendorsTab.vue"
  "src/components/project-detail/VersionsTab.vue"
  "src/components/project-detail/MilestoneGrid.vue"
  "src/components/project-detail/MilestonesTab_Enhanced.vue"
  "src/components/project-detail/MilestoneStatistics.vue"
  "src/components/ui/SearchAndFilter.vue"
  "src/components/ui/UserSelect.vue"
  "src/components/vendors/ProjectSelectionModal.vue"
  "src/components/vendors/VendorPerformanceTracker.vue"
  "src/components/vendors/VendorSelectionModal.vue"
  "src/components/workflow/EnhancedGateMeetings.vue"
  "src/components/workflow/GateMeetingDetails.vue"
  "src/pages/VendorProfilePage.vue"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing imports in $file"
    # Replace individual component imports with index imports
    sed -i "s|from '@/components/ui/button'|from '@/components/ui'|g" "$file"
    sed -i "s|from '@/components/ui/card'|from '@/components/ui'|g" "$file"
    sed -i "s|from '@/components/ui/input'|from '@/components/ui'|g" "$file"
    sed -i "s|from '@/components/ui/label'|from '@/components/ui'|g" "$file"
    sed -i "s|from '@/components/ui/select'|from '@/components/ui'|g" "$file"
    sed -i "s|from '@/components/ui/checkbox'|from '@/components/ui'|g" "$file"
    sed -i "s|from '@/components/ui/badge'|from '@/components/ui'|g" "$file"
    sed -i "s|from '@/components/ui/tabs'|from '@/components/ui'|g" "$file"
    sed -i "s|from '@/components/ui/modal'|from '@/components/ui'|g" "$file"
    sed -i "s|from '@/components/ui/loading'|from '@/components/ui'|g" "$file"
    sed -i "s|from '@/components/ui/tooltip'|from '@/components/ui'|g" "$file"
    sed -i "s|from '@/components/ui/empty-state'|from '@/components/ui'|g" "$file"
  fi
done

echo "Import fixes completed"
