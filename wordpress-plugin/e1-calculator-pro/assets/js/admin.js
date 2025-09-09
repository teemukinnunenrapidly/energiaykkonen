/**
 * E1 Calculator Admin JavaScript
 */
(function ($) {
  'use strict';

  $(document).ready(function () {

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
            let errorHtml = '<div class="notice notice-error"><p><strong>' +
              e1_calculator_admin.strings.error +
              '</strong> ' +
              response.data.message +
              '</p>';
            
            // Show debug information if available
            if (response.data.debug) {
              errorHtml += '<h4>Debug Information:</h4><ul>';
              Object.keys(response.data.debug).forEach(function(key) {
                errorHtml += '<li><strong>' + key + ':</strong> ' + response.data.debug[key] + '</li>';
              });
              errorHtml += '</ul>';
            }
            
            // Show errors if available
            if (response.data.errors && response.data.errors.length > 0) {
              errorHtml += '<h4>Detailed Errors:</h4><ul>';
              response.data.errors.forEach(function(error) {
                errorHtml += '<li>' + error + '</li>';
              });
              errorHtml += '</ul>';
            }
            
            errorHtml += '</div>';
            $result.html(errorHtml);
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
