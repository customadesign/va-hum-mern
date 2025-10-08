const userNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Profile', href: '/va/profile' },
    { name: 'Conversations', href: '/conversations' },
    ...(user?.admin ? [{ name: 'Admin Panel', href: '/admin' }] : []),
  ];