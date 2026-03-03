// Clear theme from localStorage to force light mode default
// Run this in your browser console (F12) on http://localhost:3000

// Check current theme
console.log('Current theme in localStorage:', localStorage.getItem('theme'));

// Clear the theme to use default (light)
localStorage.removeItem('theme');

// Reload the page
window.location.reload();
