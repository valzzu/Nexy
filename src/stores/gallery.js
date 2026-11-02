import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

import { convertFileUrlToImageUrl } from '../shared/utils';
import { watchState } from '../services/watchState';

export const useGalleryStore = defineStore('Gallery', () => {
    const fullscreenImageDialog = ref({
        visible: false,
        imageUrl: '',
        fileName: ''
    });

    watch(
        () => watchState.isLoggedIn,
        () => {
            fullscreenImageDialog.value.visible = false;
        },
        { flush: 'sync' }
    );

    /**
     * @param imageUrl
     * @param fileName
     */
    function showFullscreenImageDialog(imageUrl, fileName) {
        if (!imageUrl) {
            return;
        }
        const D = fullscreenImageDialog.value;
        D.imageUrl = convertFileUrlToImageUrl(imageUrl, 10_000);
        D.fileName = fileName;
        D.visible = true;
    }

    return {
        fullscreenImageDialog,
        showFullscreenImageDialog
    };
});
