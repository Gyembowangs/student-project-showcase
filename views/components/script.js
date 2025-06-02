function toggleSidebar(button) {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('active');
      button.classList.toggle('open');
    }

    function closeSidebar() {
      document.getElementById('sidebar').classList.remove('active');
      document.querySelector('.menu-toggle').classList.remove('open');
    }

    function toggleDropdown(event) {
      event.stopPropagation();
      const dropdownMenu = document.getElementById('dropdownMenu');
      dropdownMenu.classList.toggle('show');
    }

    window.addEventListener('click', function (e) {
      const dropdown = document.getElementById('userDropdown');
      const menu = document.getElementById('dropdownMenu');
      if (!dropdown.contains(e.target)) {
        menu.classList.remove('show');
      }

      // close sidebar if clicking outside on mobile
      const sidebar = document.getElementById('sidebar');
      const toggleBtn = document.querySelector('.menu-toggle');
      if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeSidebar();
      }
    });