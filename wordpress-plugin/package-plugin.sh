#!/bin/bash

# Package the E1 Calculator WordPress Plugin

PLUGIN_NAME="e1-calculator"
VERSION="1.2.0"
OUTPUT_DIR="dist"
OUTPUT_FILE="${OUTPUT_DIR}/${PLUGIN_NAME}-${VERSION}.zip"

echo "📦 Packaging E1 Calculator WordPress Plugin v${VERSION}"

# Create dist directory if it doesn't exist
mkdir -p ${OUTPUT_DIR}

# Remove old package if exists
if [ -f ${OUTPUT_FILE} ]; then
    rm ${OUTPUT_FILE}
    echo "🗑️  Removed old package"
fi

# Create the ZIP file
cd ${PLUGIN_NAME}
zip -r ../${OUTPUT_FILE} . \
    -x "*.DS_Store" \
    -x "*__MACOSX*" \
    -x "*.git*" \
    -x "node_modules/*" \
    -x "*.log"

cd ..

# Check if successful
if [ -f ${OUTPUT_FILE} ]; then
    FILE_SIZE=$(du -h ${OUTPUT_FILE} | cut -f1)
    echo "✅ Plugin packaged successfully!"
    echo "📁 Output: ${OUTPUT_FILE}"
    echo "📊 Size: ${FILE_SIZE}"
    echo ""
    echo "📋 Installation Instructions:"
    echo "1. Log in to your WordPress admin panel"
    echo "2. Go to Plugins > Add New > Upload Plugin"
    echo "3. Choose ${OUTPUT_FILE}"
    echo "4. Click 'Install Now' and then 'Activate'"
    echo "5. Use shortcode [e1_calculator] in any page or post"
else
    echo "❌ Failed to create plugin package"
    exit 1
fi