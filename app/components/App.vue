<template>
    <Page class="page" @loaded="onLoaded()" actionBarHidden="true">

        <!-- Side-drawer -->
        <RadSideDrawer ref="drawer">

            <!-- Drawer content -->
            <StackLayout ~drawerContent class="sideDrawer">

                <!-- Wash timer -->
                <StackLayout>
                    <Label class="h1" text="Wash"></Label>

                    <!-- If there is a wash -->
                    <template v-if="wash !== null">

                        <!-- Machine -->
                        <Label class="body" :text="`Machine: ` + wash.machine"></Label>

                        <!-- If there's still time left -->
                        <Label class="body" v-if="wash._duration >= 0" :text="`Remaining time in seconds: ` + _unixToString(wash._duration)"></Label>

                        <!-- If it's finished -->
                        <Label class="body" v-if="wash._duration < 0" text="Wash finished!"></Label>

                    </template>

                    <!-- If there is no wash -->
                    <template v-else>
                        <Label class="body" textWrap="true" text="Please start a wash!"></Label>
                    </template>

                </StackLayout>

                <!-- Dry timer -->
                <StackLayout>
                    <Label class="h1" text="Dry"></Label>

                    <!-- If there is a dry -->
                    <template v-if="dry !== null">

                        <!-- Machine -->
                        <Label class="body" :text="`Machine: ` + dry.machine"></Label>

                        <!-- If there's still time left -->
                        <Label class="body" v-if="dry._duration >= 0" :text="`Remaining time in seconds: ` + _unixToString(dry._duration)"></Label>

                        <!-- If it's finished -->
                        <Label class="body" v-if="dry._duration < 0" text="Dry finished!"></Label>

                    </template>

                    <!-- If there is no dry -->
                    <template v-else>
                        <Label class="body" textWrap="true" text="Please start a dry!"></Label>
                    </template>

                </StackLayout>

                <!-- Reset buttons -->
                <Button class="btn btn-default" text="Reset wash" @tap="resetWash()"></Button>
                <Button class="btn btn-default" text="Reset dry" @tap="resetDry()"></Button>

            </StackLayout>

            <!-- Main content -->
            <StackLayout ~mainContent>

                <!-- Padding -->
                <Label text="" height="10"></Label>

                <!-- Logo -->
                <Image src="~/assets/images/logo.png" @tap="_openDrawer()"></Image>

                <!-- Balance -->
                <Label class="h3" text="Balance:"></Label>
                <Label class="h1" :text="`£` + (balance / 100).toFixed(2)"></Label>

                <!-- Warning -->
                <Label v-if="this.balance < (this.washCost + this.dryCost)">
                    <FormattedString>
                        <Span text="Warning! You don't have enough funds for a wash + dry!" style="color:red"></Span>
                    </FormattedString>
                </Label>

                <!-- Options -->
                <GridLayout columns="* *" rows="* * * *">

                    <!-- Wash -->
                    <Button class="btn btn-primary" text="Wash" row="0" col="0" @tap="applyWash()"></Button>
                    <Button class="btn btn-primary btn-outline" :text="`-£` + (washCost / 100).toFixed(2)" row="0" col="1" @tap="setWash()"></Button>

                    <!-- Dry -->
                    <Button class="btn btn-primary" text="Dry" row="1" col="0" @tap="applyDry()"></Button>
                    <Button class="btn btn-primary btn-outline" :text="`-£` + (dryCost / 100).toFixed(2)" row="1" col="1" @tap="setDry()"></Button>

                    <!-- Top-up -->
                    <Button class="btn btn-primary" text="Top-up" row="2" col="0" @tap="applyTopUp()"></Button>
                    <Button class="btn btn-primary btn-outline" :text="`+£` + (topUp / 100).toFixed(2)" row="2" col="1" @tap="setTopUp()"></Button>

                    <!-- Manual override -->
                    <Button class="btn btn-primary" text="Manual override" row="3" col="0" colSpan="1" @tap="manual()"></Button>
                    <Button class="btn btn-primary btn-about" text="About" row="3" col="1" colSpan="1" @tap="about()"></Button>
                    
                    <!--<Button class="btn btn-default" text="Reset data" row="3" col="1" colSpan="1" @tap="clearData()"></Button>-->

                </GridLayout>

            </StackLayout>

        </RadSideDrawer>

    </Page>
</template>

<script>
import * as appSettings from "application-settings";
import About from "./About.vue";
import { alert, prompt, inputType } from "tns-core-modules/ui/dialogs";
import { LocalNotifications } from "nativescript-local-notifications";

export default {
    data() {
      return {
        aboutPage: About,
        balance: 0,
        washCost: 0,
        dryCost: 0,
        topUp: 0,

        wash: { // If null, there is no wash/dry
            machine: "N/A", // The machine that we're using
            endtime: 0, // The unix time when wash/dry will finish
            _duration: 0, // The duration that is displayed; is changed all the time
        },
        dry: {
            machine: "N/A",
            endtime: 0,
            _duration: 0,
        },

      }
    },

    methods: {
        onLoaded: function() {
            // If this is our first time
            if (!appSettings.hasKey("balance"))
            {
                // Give the user a warm welcome
                alert({
                    title: "First time?",
                    message: "Welcome to the Circuit Laundry Balance Keeper! Allow me to load the default values for you...",
                    okButtonText: "OK"
                }).then(() => {
                    // Init settings
                    this._setValue("balance", 1000);
                    this._setValue("washCost", 270);
                    this._setValue("dryCost", 120);
                    this._setValue("topUp", 1000);

                    // Load the settings
                    this._loadSettings();
                });
            }
            else
            {
                // Load the settings
                this._loadSettings();
            }

            // If wash/dry timers have been saved
            if (appSettings.hasKey("washmachine"))
            {
                // Load
                this.wash = {
                    machine: appSettings.getString("washmachine"),
                    endtime: appSettings.getNumber("washendtime"),
                    _duration: 0
                };
                this.dry = {
                    machine: appSettings.getString("drymachine"),
                    endtime: appSettings.getNumber("dryendtime"),
                    _duration: 0
                };
            }

            // Updates wash and dry durations
            setInterval(this._updateWashDry, 1000);
        },

        applyWash: function() {
            if (this.balance >= this.washCost)
            {
                // Gets machine number
                prompt({
                    title: "Machine number",
                    message: "What is the machine number?",
                    defaultText: "16",
                    okButtonText: "OK",
                    inputType: inputType.decimal
                })
                .then(machineNo => {

                    // Gets duration
                    prompt({
                        title: "How long?",
                        message: "How long will your wash take (in minutes)?",
                        defaultText: "39",
                        okButtonText: "OK",
                        inputType: inputType.decimal
                    })
                    .then(duration => {

                        // Stores the info
                        this.wash = {
                            machine: machineNo.text,
                            endtime: Math.floor((new Date).getTime() / 1000) + (parseFloat(duration.text) * 60),
                            _duration: 0
                        };

                        // Remembers the info
                        appSettings.setString("washmachine", this.wash.machine);
                        appSettings.setNumber("washendtime", this.wash.endtime);

                        // Apply wash
                        this.balance -= this.washCost;

                        // Save balance
                        this._setValue("balance", this.balance);
                    });
                });
            }
            else {
                alert({
                    title: "Not enough funds",
                    message: "You don't have enough funds to wash!",
                    okButtonText: "OK"
                }).then(() => {});
            }
        },

        applyDry: function() {
            if (this.balance >= this.dryCost)
            {

                // Gets machine number
                prompt({
                    title: "Machine number",
                    message: "What is the machine number?",
                    defaultText: "16",
                    okButtonText: "OK",
                    inputType: inputType.decimal
                })
                .then(machineNo => {

                    // Gets duration
                    prompt({
                        title: "How long?",
                        message: "How long will your dry take (in minutes)?",
                        defaultText: "50",
                        okButtonText: "OK",
                        inputType: inputType.decimal
                    })
                    .then(duration => {

                        // Stores the info
                        this.dry = {
                            machine: machineNo.text,
                            endtime: Math.floor((new Date).getTime() / 1000) + (parseFloat(duration.text) * 60),
                            _duration: 0
                        };

                        // Remembers the info
                        appSettings.setString("drymachine", this.dry.machine);
                        appSettings.setNumber("dryendtime", this.dry.endtime);
                
                        // Apply dry
                        this.balance -= this.dryCost;

                        // Save balance
                        this._setValue("balance", this.balance);
                    });
                });
            }
            else {
                alert({
                    title: "Not enough funds",
                    message: "You don't have enough funds to dry!",
                    okButtonText: "OK"
                }).then(() => {});
            }
        },

        applyTopUp: function() {
            // Apply top-up
            this.balance += this.topUp;

            // Save balance
            this._setValue("balance", this.balance);
        },

        setWash: function() {
            prompt({
                title: "Set the wash cost",
                message: "How much does it cost to wash?",
                defaultText: "2.70",
                okButtonText: "Set wash cost",
                cancelButtonText: "Cancel",
                inputType: inputType.decimal
            })
            .then(result => {
                if (result.result) {
                    // Update wash cost
                    this.washCost = parseInt(parseFloat(result.text) * 100);

                    // Save wash cost
                    this._setValue("washCost", this.washCost);
                }
            });
        },

        setDry: function() {
            prompt({
                title: "Set the dry cost",
                message: "How much does it cost to dry?",
                defaultText: "1.20",
                okButtonText: "Set dry cost",
                cancelButtonText: "Cancel",
                inputType: inputType.decimal
            })
            .then(result => {
                if (result.result) {
                    // Update dry cost
                    this.dryCost = parseInt(parseFloat(result.text) * 100);

                    // Save dry cost
                    this._setValue("dryCost", this.dryCost);
                }
            });
        },

        setTopUp: function() {
            prompt({
                title: "Set the top-up amount",
                message: "How much are you topping up?",
                defaultText: "10",
                okButtonText: "Set top-up amount",
                cancelButtonText: "Cancel",
                inputType: inputType.decimal
            })
            .then(result => {
                if (result.result) {
                    // Update top-up amount
                    this.topUp = parseInt(parseFloat(result.text) * 100);

                    // Save top-up amount
                    this._setValue("topUp", this.topUp);
                }
            });
        },

        resetWash: function() {
            // Reset local data
            this.wash = {
                machine: "N/A",
                endtime: 0,
                _duration: 0
            };

            // Reset file data
            appSettings.remove("washmachine");
            appSettings.remove("washendtime");

            // Confirm with user
            alert("Reset wash timer data!");
        },

        resetDry: function() {
            // Reset local data
            this.dry = {
                machine: "N/A",
                endtime: 0,
                _duration: 0
            };

            // Reset file data
            appSettings.remove("drymachine");
            appSettings.remove("dryendtime");

            // Confirm with user
            alert("Reset dry timer data!");
        },

        manual: function() {
            prompt({
                title: "Manually set the balance",
                message: "What would you like to set the balance to?",
                defaultText: "10",
                okButtonText: "Set balance",
                cancelButtonText: "Cancel",
                inputType: inputType.decimal
            })
            .then(result => {
                if (result.result) {
                    // Update balance
                    this.balance = parseInt(parseFloat(result.text) * 100);

                    // Save balance
                    this._setValue("balance", this.balance);
                }
            });
        },

        about: function() {
            this.$navigateTo(this.aboutPage);
            /*alert({
                title: "Circuit Laundry Balance Keeper",
                message: "Written by Matthew Barnes 2019",
                okButtonText: "OK"
            }).then(() => {});*/
        },

        /*clearData: function() {
            appSettings.clear();
            alert("Data cleared!").then( () => {} );
        },*/

        // Gets current unix time
        _getUnixTime: function() {
            return Math.floor((new Date).getTime() / 1000);
        },

        // Updates the wash and dry remaining time
        _updateWashDry: function() {
            // Gets new durations
            let newWashDuration = this.wash.endtime - this._getUnixTime();
            let newDryDuration = this.dry.endtime - this._getUnixTime();

            // Checks if our wash / dry is finished
            if (this.wash._duration > 0 && newWashDuration <= 0)
            {
                LocalNotifications.schedule([{
                    title: 'Your wash is finished!',
                    body: 'Your machine number is ' + this.wash.machine
                }]);
            }

            if (this.dry._duration > 0 && newDryDuration <= 0)
            {
                LocalNotifications.schedule([{
                    title: 'Your dry is finished!',
                    body: 'Your machine number is ' + this.dry.machine
                }]);
            }

            // Updates wash and dry
            this.wash._duration = newWashDuration;
            this.dry._duration = newDryDuration;
        },

        // Converts a unix time to string
        _unixToString: function(rawSeconds) {
            let minutes = Math.floor(rawSeconds / 60);
            let seconds = rawSeconds - (minutes * 60);
            return minutes + "m " + seconds + "s";
        },

        // Opens the side-drawer
        _openDrawer() {
            this.$refs.drawer.nativeView.showDrawer();
        },

        // Closes the side-drawer
        _closeDrawer() {
            this.$refs.drawer.nativeView.closeDrawer();
        },

        _setValue: function(key, value) {
            appSettings.setNumber(key, value);
        },

        _getValue: function(key) {
            return parseFloat(appSettings.getNumber(key));
        },

        _loadSettings: function() {
            this.balance = parseFloat(appSettings.getNumber("balance"));
            this.washCost = parseFloat(appSettings.getNumber("washCost"));
            this.dryCost = parseFloat(appSettings.getNumber("dryCost"));
            this.topUp = parseFloat(appSettings.getNumber("topUp"));
        }
    }
};
</script>

<style scoped>
    ActionBar {
        background-color: rgb(12, 109, 178);
        color: white;
    }

    Image {
        width: 50%;
    }

    Label {
        text-align: center;
    }

    .body {
        color:white;
    }

    .btn-about {
        background-color: rgb(12, 109, 178);
        color: white;
    }

    .sideTitleStackLayout {
        background-color: blue;
    }

    .sideDrawer {
        background-color: rgb(12, 109, 178);
    }
</style>
