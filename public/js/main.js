// CareTrack Clinic — Frontend JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle Logic ---
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    // Set initial icon based on current state (applied by head script)
    const isDark = document.documentElement.classList.contains('dark');
    themeToggle.innerHTML = isDark ? '<i data-lucide="sun" class="w-5 h-5"></i>' : '<i data-lucide="moon" class="w-5 h-5"></i>';

    themeToggle.addEventListener('click', () => {
      const isNowDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isNowDark ? 'dark' : 'light');
      themeToggle.innerHTML = isNowDark ? '<i data-lucide="sun" class="w-5 h-5"></i>' : '<i data-lucide="moon" class="w-5 h-5"></i>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  }

  // --- Mobile sidebar toggle ---
  const mobileToggle = document.querySelector('.mobile-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  // --- Auto-dismiss alerts ---
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-10px)';
      setTimeout(() => alert.remove(), 300);
    }, 4000);
  });

  // --- Delete confirmation ---
  window.confirmDelete = function(formId) {
    const modal = document.getElementById('deleteModal-' + formId);
    if (modal) modal.classList.add('show');
  };

  window.closeModal = function(formId) {
    const modal = document.getElementById('deleteModal-' + formId);
    if (modal) modal.classList.remove('show');
  };

  // --- Search filter ---
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('table tbody tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // --- Active sidebar link ---
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (href !== '/dashboard' && currentPath.startsWith(href))) {
      link.classList.add('active');
    }
  });

  // Initialize all lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
