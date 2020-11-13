<template>
<div>
<p v-bind="property1" style="noProperty" @click="noProperty" >{{property2}} YES</p>
<input v-model="twoWayProperty"/>
</div>
</template>