document.addEventListener('DOMContentLoaded', function () {
    // Select the dropdown toggle button and the dropdown menu
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    // Toggle the dropdown menu when the dropdown button is clicked
    dropdownToggle.addEventListener('click', function (event) {
        // Prevents the event from bubbling up to the document and triggering the close event
        event.stopPropagation();
        
        // Toggle the visibility of the dropdown menu
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Close the dropdown menu if clicked outside of it
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.dropdown')) {
            dropdownMenu.style.display = 'none';
        }
    });
});
// Placeholder JavaScript
console.log("Student Project Showcase loaded.");

// Add your interactivity here if needed
