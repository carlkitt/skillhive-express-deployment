Apply migrations in ./backend/database/migrations using your DB client.

Example (MySQL CLI):

1. Backup database:
   mysqldump -u <user> -p <database> > backup.sql

2. Apply migration:
   mysql -u <user> -p <database> < 20250902_fix_bookings_schema.sql

If you use phpMyAdmin, open the SQL tab for the `bookings` table or the database
and paste the contents of `20250902_fix_bookings_schema.sql` and run.

After applying the migration, restart the backend server and create a booking
from the app to confirm rows are inserted.
