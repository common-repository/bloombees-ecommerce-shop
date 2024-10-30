<?php
/**
 * @package bloombees_shortcode_api
 * @version 2.3.3
 */
/*
Plugin Name: Bloombees Catalog
Plugin URI: https://wordpress.org/plugins/bloombees-ecommerce-shop/
Description: Show your Bloombees store on your WP site
Author: Bloombees (Alex Makarov, Gauthier de Meirsman, Adrián Martínez)
Version: 2.3.3
Author URI: https://www.bloombees.com
*/

class BloombeesShortcodeApiGenerator
{
    const BRAND_NAME_KEY = 'brand';
    const NEED_OFFSET_KEY = 'enable_offset';

    public function get_bloombees_shortcode_api($atts, $content = null)
    {
        wp_enqueue_script('bloombees_api_js', plugin_dir_url(__FILE__) . 'scripts/script.js');
        wp_enqueue_style('bloombees_api_css', plugin_dir_url(__FILE__) . 'styles/styles.css');

        $config = array();
        $options = get_option(BloombeesShortcodeApiSettings::DEFAULT_PLUGIN_OPTIONS);


        // Read options from the db
        $optionsMapping = array(
            BloombeesShortcodeApiSettings::DEFAULT_BRAND_OPTION_KEY => self::BRAND_NAME_KEY,
            BloombeesShortcodeApiSettings::HAS_MENU_OPTIONS_KEY  => self::NEED_OFFSET_KEY
        );

        foreach ($optionsMapping as $key => $value) {
            $config[$value] = $options[$key];
        }

        // Short tags settings should override db settings
        if (!empty($atts[self::BRAND_NAME_KEY])) {
            $config[self::BRAND_NAME_KEY] = $atts[self::BRAND_NAME_KEY];
        }

        $replacement = '<script>window.bb_config = {};';
        foreach ($config as $key => $value) {
            $replacement .= sprintf('window.bb_config.%s = \'%s\';', $key, $value);
        }
        $replacement .= '</script>';


        $replacementTemplate = '
        <div class="u-wrapper">
            <div class="c-details-card u-display--none" id="detailsCardResource">
                <div class="c-details-card--header">
                    <h2 class="u-margin-title--m u-font-size--3xl u-align--center" id="detailsCardTitle">%detailsCardTitleReplace%</h2>
                    
                </div>

                <div class="u-align--container u-box-shadow u-background--white" id="detailsCardDesc">
                    <div class="c-details-card--img u-bg-images--contain u-animation--fade-in" id="detailsCardImg" style="background-image: url(\'%detailsCardImgReplace%\')">
                        <ul class="c-nav-slider" id="navSliderResource"></ul>
                    </div>

                    <div class="c-details-card--desc">
                        <p class="u-mar0 u-font-size--sm u-promo">%detailsCardDescPromoEUReplace%</p>
                        <p class="u-margin-title--sm u-font-size--xxl">%detailsCardDescCostEUReplace%</p>
                        <a href="%buyNowLink%" target=“_blank” class="c-btn c-btn--m c-btn--block c-btn--green u-font-size--l">%buyNowLabel%</a>
                        <p class="u-font-color--grey-lighter u-line-height--big">%detailsCardDescDescReplace%</p>
                    </div>
                </div>

                <ul class="c-nav-img-slider" id="navImgSliderResource" alt="goti"></ul>
            </div>

            <ul class="c-goods" id="goods" style="margin-top: 15px!important;">
                <li class="c-goods--item u-box-shadow u-display--none" id="goodsItemResource">
                  <a href="%goodsItemLinkReplace%" data-goods-link data-goods-img="%goodsItemLinkReplace%" class="c-goods--link u-bg-images--contain">
                  %goodsItemTagReplace%
                            <span class="c-goods--link-hover">
                            <span class="c-goods--link-hover-text">%viewAndBuyLabel%</span>
                        </span>
                    </a>
                    <p class="c-goods--sign u-align--item u-align--column-between">
                        <span class="c-goods--title">%goodsItemNameReplace%</span>
                        <strong class="u-display--block u-font-weight--bold c-goods--price u-font-size--xsm u-promo">%goodsItemPromoReplace%</strong>
                       <strong class="u-display--block u-font-weight--bold c-goods--price">%goodsItemCostReplace%</strong>
                    </p>
                </li>
            </ul>
        </div>
        ';

        $search = array(
            '%contactSellerLabel%',
            '%buyNowLabel%',
            '%returnLabel%',
            '%reportLabel%',
            '%brandNameLabel%',
            '%viewAndBuyLabel%',
            '%contactSellerLabel%',
        );

        $replace = array(
            __('Contact seller'),
            __('Buy now'),
            __('Return'),
            __('Report'),
            $config[self::BRAND_NAME_KEY],
            __('View and buy'),
            __('Contact Seller')
        );

        $replacement .= str_replace($search, $replace, $replacementTemplate);

        return $replacement;
    }

}

add_shortcode('bb_catalog', array(new BloombeesShortcodeApiGenerator(), 'get_bloombees_shortcode_api'));


class BloombeesShortcodeApiSettings
{
    const DEFAULT_PLUGIN_OPTIONS = 'bloombees_api_plugin_options';
    const DEFAULT_BRAND_OPTION_KEY = 'bloombees_api_default_brand';
    const HAS_MENU_OPTIONS_KEY = 'bloombees_api_has_menu';

    /**
     * Holds the values to be used in the fields callbacks
     */
    private $options;

    /**
     * Start up
     */
    public function __construct()
    {
        add_action('admin_menu', array($this, 'add_plugin_page'));
        add_action('admin_init', array($this, 'page_init'));
        add_action('admin_enqueue_scripts', array($this, 'load_scripts'));
    }

    /**
     * Add options page
     */
    public function add_plugin_page()
    {
        // This page will be under "Settings"
        add_options_page(
            'Settings Admin',
            'Bloombees Catalog Settings',
            'manage_options',
            'bloombees_shortocode_api_settings_admin',
            array($this, 'create_admin_page')
        );
    }

    public function load_scripts()
    {

    }

    /**
     * Options page callback
     */
    public function create_admin_page()
    {
        $this->options = get_option(self::DEFAULT_PLUGIN_OPTIONS);
        ?>
        <div class="wrap">
            <form method="post" action="options.php">
                <?php
                settings_fields('bloombees_shortcode_api_option_group');
                do_settings_sections('bloombees_shortocode_api_settings_admin');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    /**
     * Register and add settings
     */
    public function page_init()
    {
        register_setting(
            'bloombees_shortcode_api_option_group', // Option group
            self::DEFAULT_PLUGIN_OPTIONS, // Option name
            array($this, 'sanitize') // Sanitize
        );

        add_settings_section(
            'setting_section_id', // ID
            'Bloombees Catalog  Settings', // Title
            array($this, 'print_section_info'), // Callback
            'bloombees_shortocode_api_settings_admin' // Page
        );

        add_settings_field(
            self::DEFAULT_BRAND_OPTION_KEY,
            'Default Brand Name',
            array($this, 'default_brand_callback'),
            'bloombees_shortocode_api_settings_admin',
            'setting_section_id'
        );

        add_settings_field(
            self::HAS_MENU_OPTIONS_KEY,
            'Does your theme contain sticky header?',
            array($this, 'has_menu_callback'),
            'bloombees_shortocode_api_settings_admin',
            'setting_section_id'
        );

    }

    /**
     * Sanitize each setting field as needed
     *
     * @param array $input Contains all settings fields as array keys
     * @return array
     */
    public function sanitize($input)
    {
        $new_input = array();

        if (isset($input[self::DEFAULT_BRAND_OPTION_KEY])) {
            $new_input[self::DEFAULT_BRAND_OPTION_KEY] = sanitize_text_field($input[self::DEFAULT_BRAND_OPTION_KEY]);
        }
        if (isset($input[self::HAS_MENU_OPTIONS_KEY])) {
            $new_input[self::HAS_MENU_OPTIONS_KEY] = (bool) $input[self::DEFAULT_BRAND_OPTION_KEY];
        }

        return $new_input;
    }

    /**
     * Print the Section text
     */
    public function print_section_info()
    {
        print 'Enter your bloombees credentials below:';
    }

    public function default_brand_callback()
    {
        printf(
            '<input type="text" id="default_brand" name="' . self::DEFAULT_PLUGIN_OPTIONS . '[' . self::DEFAULT_BRAND_OPTION_KEY . ']" value="%s" />',
            isset($this->options[self::DEFAULT_BRAND_OPTION_KEY]) ? esc_attr($this->options[self::DEFAULT_BRAND_OPTION_KEY]) : ''
        );
    }
    public function has_menu_callback()
    {
        printf(
            '<input type="checkbox" id="has_menu" name="' . self::DEFAULT_PLUGIN_OPTIONS . '[' . self::HAS_MENU_OPTIONS_KEY . ']" %s />
             Check if contains, leave unchecked otherwise.',
            isset($this->options[self::HAS_MENU_OPTIONS_KEY]) && $this->options[self::HAS_MENU_OPTIONS_KEY]
                ? 'checked'
                : ''
        );
    }
}

if (is_admin()) {
    $my_settings_page = new BloombeesShortcodeApiSettings();
}
