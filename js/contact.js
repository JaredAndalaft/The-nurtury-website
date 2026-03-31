/* ========================================
   THE NURTURY - CONTACT FORM JS
   Form validation and submission handling
   ======================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var successMsg = document.getElementById('contact-success');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = validateForm(form);
      if (valid) {
        form.style.display = 'none';
        if (successMsg) successMsg.classList.add('active');
      }
    });

    // Remove error on input
    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        var group = this.closest('.form-group');
        if (group) group.classList.remove('error');
      });
    });
  });

  function validateForm(form) {
    var valid = true;

    // Name
    var name = form.querySelector('#cf-name');
    if (name && !name.value.trim()) {
      setError(name);
      valid = false;
    }

    // Email
    var email = form.querySelector('#cf-email');
    if (email) {
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
        setError(email);
        valid = false;
      }
    }

    // Phone
    var phone = form.querySelector('#cf-phone');
    if (phone) {
      var phoneVal = phone.value.trim().replace(/[\s\-()]/g, '');
      if (!phoneVal || phoneVal.length < 9) {
        setError(phone);
        valid = false;
      }
    }

    // Interest
    var interest = form.querySelector('#cf-interest');
    if (interest && !interest.value) {
      setError(interest);
      valid = false;
    }

    // Message
    var message = form.querySelector('#cf-message');
    if (message && !message.value.trim()) {
      setError(message);
      valid = false;
    }

    return valid;
  }

  function setError(field) {
    var group = field.closest('.form-group');
    if (group) group.classList.add('error');
    field.focus();
  }

})();
