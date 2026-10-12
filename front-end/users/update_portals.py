import os
import glob

base_dir = r'c:\Users\Mithin Reddy\Downloads\Penguin_10_React\front-end\users'
files = glob.glob(os.path.join(base_dir, '**/*.html'), recursive=True)

portals = {
    'attendee': ('Attendee Portal', 'Access your events and tickets', 'Attendee Access'),
    'client': ('Client Portal', 'Manage your event bookings', 'Client Access'),
    'organizer': ('Organizer Portal', 'Manage and create events', 'Organizer Access'),
    'staff': ('Staff Portal', 'Event management and support', 'Staff Access'),
    'superuser': ('Super Admin Portal', 'System administration', 'Admin Access'),
    'employee1': ('Employee 1 Portal', 'Employee workspace', 'Internal Access'),
    'employee2': ('Employee 2 Portal', 'Employee workspace', 'Internal Access'),
    'employee3': ('Employee 3 Portal', 'Employee workspace', 'Internal Access')
}

for filepath in files:
    filename = os.path.basename(filepath).replace('.html', '')
    
    if filename in portals:
        heading, desc, eyebrow = portals[filename]
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Replace the specific lines
        content = content.replace(
            '<div class="l-eyebrow">Internal Access</div>',
            f'<div class="l-eyebrow">{eyebrow}</div>'
        )
        content = content.replace(
            '<h1 class="l-heading">Employee Portal</h1>',
            f'<h1 class="l-heading">{heading}</h1>'
        )
        content = content.replace(
            '<p class="l-desc" style="margin:0 auto">Select your department to continue</p>',
            f'<p class="l-desc" style="margin:0 auto">{desc}</p>'
        )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Updated {filename}.html")

