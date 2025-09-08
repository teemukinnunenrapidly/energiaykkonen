/**
 * E1 Calculator Admin JavaScript
 */
(function ($) {
  'use strict';

  $(document).ready(function () {
    // Test connection button
    $('#test-connection-btn').on('click', function () {
      const $btn = $(this);
      const $spinner = $btn.siblings('.spinner');
      const $result = $('#action-result');

      $btn.prop('disabled', true);
      $spinner.addClass('is-active');
      $result.html('');

      $.ajax({
        url: e1_calculator_admin.ajax_url,
        type: 'POST',
        data: {
          action: 'e1_test_connection',
          nonce: e1_calculator_admin.nonce,
        },
        success: function (response) {
          if (response.success) {
            $result.html(
              '<div class="notice notice-success"><p>' +
                response.data.message +
                '</p></div>'
            );
          } else {
            $result.html(
              '<div class="notice notice-error"><p>' +
                response.data.message +
                '</p></div>'
            );
          }
        },
        error: function () {
          $result.html(
            '<div class="notice notice-error"><p>' +
              e1_calculator_admin.strings.error +
              ' Connection test failed' +
              '</p></div>'
          );
        },
        complete: function () {
          $btn.prop('disabled', false);
          $spinner.removeClass('is-active');
        },
      });
    });

    // Sync widget button
    $('#sync-widget-btn').on('click', function () {
      const $btn = $(this);
      const $spinner = $btn.siblings('.spinner');
      const $result = $('#action-result');

      $btn.prop('disabled', true);
      $spinner.addClass('is-active');
      $result.html(
        '<div class="notice notice-info"><p>' +
          e1_calculator_admin.strings.syncing +
          '</p></div>'
      );

      $.ajax({
        url: e1_calculator_admin.ajax_url,
        type: 'POST',
        data: {
          action: 'e1_sync_widget',
          nonce: e1_calculator_admin.nonce,
        },
        success: function (response) {
          if (response.success) {
            $result.html(
              '<div class="notice notice-success"><p>' +
                e1_calculator_admin.strings.success +
                ' ' +
                response.data.message +
                '</p></div>'
            );

            // Reload page after 2 seconds to show updated status
            setTimeout(function () {
              window.location.reload();
            }, 2000);
          } else {
            $result.html(
              '<div class="notice notice-error"><p>' +
                e1_calculator_admin.strings.error +
                ' ' +
                response.data.message +
                '</p></div>'
            );
          }
        },
        error: function () {
          $result.html(
            '<div class="notice notice-error"><p>' +
              e1_calculator_admin.strings.error +
              ' Sync failed' +
              '</p></div>'
          );
        },
        complete: function () {
          $btn.prop('disabled', false);
          $spinner.removeClass('is-active');
        },
      });
    });

    // Clear cache button
    $('#clear-cache-btn').on('click', function () {
      if (!confirm('Are you sure you want to clear the cache?')) {
        return;
      }

      const $btn = $(this);
      const $spinner = $btn.siblings('.spinner');
      const $result = $('#action-result');

      $btn.prop('disabled', true);
      $spinner.addClass('is-active');
      $result.html('');

      $.ajax({
        url: e1_calculator_admin.ajax_url,
        type: 'POST',
        data: {
          action: 'e1_clear_cache',
          nonce: e1_calculator_admin.nonce,
        },
        success: function (response) {
          if (response.success) {
            $result.html(
              '<div class="notice notice-success"><p>' +
                response.data.message +
                '</p></div>'
            );

            // Reload page if on cache page
            if (window.location.href.includes('e1-calculator-cache')) {
              setTimeout(function () {
                window.location.reload();
              }, 1000);
            }
          } else {
            $result.html(
              '<div class="notice notice-error"><p>' +
                response.data.message +
                '</p></div>'
            );
          }
        },
        error: function () {
          $result.html(
            '<div class="notice notice-error"><p>' +
              'Cache clear failed' +
              '</p></div>'
          );
        },
        complete: function () {
          $btn.prop('disabled', false);
          $spinner.removeClass('is-active');
        },
      });
    });

    // Restore backup button
    $('#restore-backup-btn').on('click', function () {
      if (
        !confirm(
          'Are you sure you want to restore the latest backup? This will replace the current widget files.'
        )
      ) {
        return;
      }

      const $btn = $(this);
      const $spinner = $('.spinner');
      const $result = $('#action-result');

      $btn.prop('disabled', true);
      $spinner.addClass('is-active');
      $result.html(
        '<div class="notice notice-info"><p>' +
          'Restoring backup...' +
          '</p></div>'
      );

      $.ajax({
        url: e1_calculator_admin.ajax_url,
        type: 'POST',
        data: {
          action: 'e1_restore_backup',
          nonce: e1_calculator_admin.nonce,
        },
        success: function (response) {
          if (response.success) {
            $result.html(
              '<div class="notice notice-success"><p><strong>✅ Backup Restored!</strong><br>' +
                response.data.message +
                '</p></div>'
            );

            // Reload page after 2 seconds to show updated status
            setTimeout(function () {
              window.location.reload();
            }, 2000);
          } else {
            $result.html(
              '<div class="notice notice-error"><p><strong>❌ Restore Failed!</strong><br>' +
                response.data.message +
                '</p></div>'
            );
          }
        },
        error: function () {
          $result.html(
            '<div class="notice notice-error"><p><strong>❌ Restore Failed!</strong><br>' +
              'Network error during backup restore' +
              '</p></div>'
          );
        },
        complete: function () {
          $btn.prop('disabled', false);
          $spinner.removeClass('is-active');
        },
      });
    });

    // Debug sync button
    $('#debug-sync-btn').on('click', function () {
      const $btn = $(this);
      const $spinner = $btn.siblings('.spinner');
      const $result = $('#action-result');

      $btn.prop('disabled', true);
      $spinner.addClass('is-active');
      $result.html(
        '<div class="notice notice-info"><p>Running diagnostics...</p></div>'
      );

      $.ajax({
        url: e1_calculator_admin.ajax_url,
        type: 'POST',
        data: {
          action: 'e1_debug_sync',
          nonce: e1_calculator_admin.nonce,
        },
        success: function (response) {
          if (response.success) {
            $result.html(
              '<div class="notice notice-warning"><p><strong>Debug Information:</strong><br><pre>' +
                response.data.message +
                '</pre></p></div>'
            );
          } else {
            $result.html(
              '<div class="notice notice-error"><p>' +
                response.data.message +
                '</p></div>'
            );
          }
        },
        error: function () {
          $result.html(
            '<div class="notice notice-error"><p>Debug request failed</p></div>'
          );
        },
        complete: function () {
          $btn.prop('disabled', false);
          $spinner.removeClass('is-active');
        },
      });
    });

    // Toggle API key visibility
    $('#e1_calculator_api_key')
      .on('focus', function () {
        $(this).attr('type', 'text');
      })
      .on('blur', function () {
        $(this).attr('type', 'password');
      });

    // Handle API key save
    $('form').on('submit', function () {
      const $apiKey = $('#e1_calculator_api_key');
      if ($apiKey.length && $apiKey.val()) {
        // The API key will be encrypted server-side
        // Here we just ensure it's being sent
        $apiKey.attr('name', 'e1_calculator_api_key');
      }
    });
  });
})(jQuery);
