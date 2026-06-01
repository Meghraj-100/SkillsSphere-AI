import os

old_navbar_path = 'old_landing_navbar.jsx'
new_navbar_path = 'client/src/shared/components/Navbar.jsx'

with open(old_navbar_path, 'r') as f:
    content = f.read()

content = content.replace(
    "import NotificationsDropdown from '../components/NotificationsDropdown';",
    "import NotificationsDropdown from './NotificationsDropdown';"
)

with open(new_navbar_path, 'w') as f:
    f.write(content)

print("Successfully restored the old Navbar into shared/components with updated imports!")
