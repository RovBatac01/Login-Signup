### How to Update Dashboard.jsx

To use the PageTitle component for the "Dashboard" title, make the following changes to your Dashboard.jsx file:

1. Ensure that PageTitle is imported at the top of the file:
```jsx
import PageTitle from "../components/PageTitle"; // Import PageTitle component
```

2. Add the PageTitle component at the beginning of the content, right after the opening `<div className={styles.dbContents}>` tag:
```jsx
        <div className={styles.dbContents}>
          {/* Dashboard Title */}
          <PageTitle title="DASHBOARD" />
          
          {/* Dashboard Metrics Section */}
          <div className={styles.meterRowFlex}>
            <DashboardPage />
          </div>
```

The PageTitle component will display "DASHBOARD" in all caps with the blue underline, matching the style of other pages in your application.
