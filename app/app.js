import Vue from "nativescript-vue";
import App from "./components/App";

require("nativescript-local-notifications");

import RadSideDrawer from 'nativescript-ui-sidedrawer/vue';
Vue.use(RadSideDrawer);

Vue.registerElement("VideoPlayer", () => require("nativescript-videoplayer").Video);
//Vue.registerElement("RadSideDrawer", () => require("nativescript-ui-sidedrawer").RadSideDrawer);

new Vue({

    template: `
        <Frame>
            <App />
        </Frame>`,

    components: {
        App
    }
}).$start();
