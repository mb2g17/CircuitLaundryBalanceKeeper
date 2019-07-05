<template>
    <Page class="page" actionBarHidden="true">

        <GridLayout columns="*" rows="* * * *">

	        <FlexboxLayout row="0" col="0" rowSpan="2" flexDirection="column" justifyContent="center" alignItems="center">

	        	<Label class="h2" text="Circuit Laundry Balance Keeper"></Label>
	        	<Label class="h3" text="Written by Matthew Barnes 2019"></Label>

                <!-- Padding -->
                <Label text="" height="10"></Label>

	        	<Label class="body" text="Tap on the logo to view current washes/dries!"></Label>

			</FlexboxLayout>

	        <FlexboxLayout row="2" col="0" flexDirection="column" justifyContent="center" alignItems="center">

	        	<VideoPlayer ref="player" src="~/assets/images/video.mp4" autoplay="true" loop="true" height="100"></VideoPlayer>

			</FlexboxLayout>

	        <FlexboxLayout row="3" col="0" flexDirection="column" justifyContent="center" alignItems="center">
	        	<Button class="btn btn-primary" row="1" col="0" text="Back" @tap="$navigateTo(App)"></Button>
			</FlexboxLayout>

        </GridLayout>

    </Page>
</template>

<script>

import App from "./App.vue";

export default {
	data() {
		return {
			App
		};
	}
};

</script>

<style scoped>

	Label {
		text-align:center;
	}

	Button {
		width: 50%;
		height: 40%;
	}

	.body {
		color:white;
	}

</style>