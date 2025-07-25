# Admin Dashboard Setup Instructions

## Overview
The SparklePro app now includes a comprehensive admin dashboard with role-based access control. Admins can manage bookings, users, view analytics, and update their profile.

## 🔧 Setup Steps

### 1. Database Setup
Run the SQL script to create user roles and admin policies:

```sql
-- Execute in Supabase SQL Editor
-- File: create-user-roles.sql
```

This script will:
- Create the `user_role` enum ('customer', 'admin')
- Add role column to profiles table
- Set up RLS policies for admin access
- Allow admins to view and manage all data

### 2. Create Admin User
1. **First, sign up** through the app with your admin email
2. **Then run this SQL** to make your account an admin:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com');
```

Replace `your-admin-email@example.com` with your actual email.

### 3. Test Role-Based Access
- **Customer users**: Will see the normal app (Home, Booking, History, Profile)
- **Admin users**: Will automatically be redirected to the admin dashboard

## 📊 Admin Dashboard Features

### Orders Management
- **Real-time stats**: Active orders, completed today, revenue, ratings
- **Order list**: View all bookings with customer details
- **Status updates**: Change booking status (pending → confirmed → completed)
- **Search & filter**: Find specific orders quickly

### Users Management  
- **User overview**: Total users, new registrations, active clients
- **User details**: View customer profiles and contact information
- **Role management**: See user roles and registration dates
- **User actions**: View and edit user profiles

### Analytics Dashboard
- **Revenue tracking**: Monthly revenue and order statistics
- **Performance metrics**: Average ratings and customer satisfaction
- **Popular services**: Top-performing services with revenue breakdown
- **Growth statistics**: User growth and booking trends

### Profile Settings
- **Admin profile**: Update admin name and contact information
- **Password management**: Change admin password
- **Account security**: Manage admin account settings

## 🎨 UI Features

### Design Elements
- **Mobile-first**: Optimized for mobile devices
- **Modern UI**: Gradient backgrounds and glass-morphism effects
- **Responsive tabs**: Bottom navigation for easy access
- **Real-time data**: Live statistics and updates
- **Interactive elements**: Hover effects and smooth transitions

### Navigation
- **Tab-based**: Orders, Users, Analytics, Profile tabs
- **Status badges**: Color-coded booking statuses
- **Action buttons**: View, Edit, Update, Delete actions
- **Breadcrumbs**: Clear navigation structure

## 🔐 Security Features

### Role-Based Access Control (RBAC)
- **Authentication required**: Only logged-in users can access admin areas
- **Role verification**: Automatic role checking on every request
- **Data isolation**: Customers can only see their own data
- **Admin privileges**: Admins can view and manage all data

### Database Security
- **Row Level Security (RLS)**: Enforced at database level
- **Policy-based access**: Different policies for customers vs admins
- **Secure queries**: All data access through Supabase RLS policies
- **Audit trail**: Track all admin actions and changes

## 🚀 Usage Instructions

### For Customers
- No changes to existing functionality
- Same login process and app experience
- Automatic role detection and routing

### For Admins
1. **Login** with admin credentials
2. **Auto-redirect** to admin dashboard
3. **Navigate** using bottom tabs
4. **Manage data** using action buttons
5. **Update statuses** with one-click actions

### Managing Bookings
1. Go to **Orders** tab
2. View booking details in cards
3. Use **Update** button to change status
4. Use **View** button for detailed information

### Managing Users
1. Go to **Users** tab  
2. See all registered customers
3. View user details and statistics
4. Use **Edit** button to modify profiles

### Viewing Analytics
1. Go to **Analytics** tab
2. See revenue and performance metrics
3. Check popular services
4. Monitor growth statistics

## 🛠️ Technical Implementation

### Components Created
- `AdminDashboard.tsx`: Main admin interface
- `RoleBasedRoute.tsx`: Role-based routing component
- Updated `AuthContext.tsx`: Role checking and profile management

### Database Changes
- `user_role` enum with 'customer' and 'admin' values
- Role column in profiles table
- RLS policies for admin access
- Indexes for performance

### Routing Updates
- Role-based routing in App.tsx
- Automatic redirection based on user role
- Maintained backward compatibility

## 🔄 Future Enhancements

### Potential Additions
- **Booking assignment**: Assign cleaners to specific bookings
- **Revenue reports**: Detailed financial reporting
- **Customer communication**: In-app messaging system
- **Service management**: Add/edit cleaning services
- **Cleaner management**: Manage cleaning staff
- **Notification system**: Admin alerts and notifications

### Advanced Features
- **Bulk operations**: Mass booking updates
- **Export functionality**: CSV/PDF reports
- **Calendar integration**: Booking schedule visualization  
- **Real-time notifications**: Live updates for new bookings
- **Advanced analytics**: Charts and graphs
- **Custom dashboard**: Personalized admin views

## 🐛 Troubleshooting

### Common Issues
1. **Admin not redirecting**: Check if role is set correctly in database
2. **Data not loading**: Verify RLS policies are applied
3. **Permission errors**: Ensure admin has proper database access
4. **Profile not found**: Check if profile exists in profiles table

### Solutions
1. **Check user role**: Query profiles table for correct role
2. **Verify RLS**: Ensure policies are enabled and correct
3. **Console logs**: Check browser console for errors
4. **Database logs**: Check Supabase logs for query issues

## 📞 Support
If you encounter issues:
1. Check browser console for errors
2. Verify database setup and RLS policies
3. Confirm admin user role is set correctly
4. Test with a customer account to ensure normal functionality 