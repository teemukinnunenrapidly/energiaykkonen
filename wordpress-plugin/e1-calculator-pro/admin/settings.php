<?php
// e1-calculator-pro/admin/settings.php

// Add settings page
add_action('admin_menu', 'e1_widget_add_settings_page');
function e1_widget_add_settings_page() {
    add_options_page(
        'E1 Calculator Widget Settings',
        'E1 Widget',
        'manage_options',
        'e1-widget-settings',
        'e1_widget_settings_page'
    );
}

function e1_widget_settings_page() {
    ?>
    <div class="wrap">
        <h1>E1 Calculator Widget Settings</h1>
        <form method="post" action="options.php">
            <?php settings_fields('e1_widget_settings'); ?>
            
            <table class="form-table">
                <tr>
                    <th scope="row">API URL</th>
                    <td>
                        <input type="url" name="e1_api_url" 
                               value="<?php echo esc_attr(get_option('e1_api_url')); ?>" 
                               class="regular-text" />
                        <p class="description">Your Next.js app URL (e.g., https://your-app.vercel.app)</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Widget Secret Key</th>
                    <td>
                        <input type="password" name="e1_widget_secret_key" 
                               value="<?php echo esc_attr(get_option('e1_widget_secret_key')); ?>" 
                               class="regular-text" />
                        <p class="description">Must match WIDGET_SECRET_KEY in your .env file</p>
                    </td>
                </tr>
            </table>
            
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// Register settings
add_action('admin_init', 'e1_widget_register_settings');
function e1_widget_register_settings() {
    register_setting('e1_widget_settings', 'e1_api_url');
    register_setting('e1_widget_settings', 'e1_widget_secret_key');
}