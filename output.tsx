import React from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Button, Card, Header, SearchableInput } from '../components';

export default function GeneratedScreen() {
  return (
    <SafeAreaView style={{"flex":1,"backgroundColor":"#FFFFFF"}}>
      <ScrollView contentContainerStyle={{"backgroundColor":"#F9FAFB"}}>
        <View
  style={{"paddingTop":64.57147979736328,"backgroundColor":"#F9FAFB"}}
>
          <View>
            <View
  style={{"gap":7.996376037597656,"paddingTop":31.99463653564453,"paddingRight":15.992767333984375,"paddingBottom":0.5822169780731201,"paddingLeft":15.992767333984375,"backgroundColor":"#FFFFFF","borderColor":"#E5E7EB","borderWidth":1}}
>
              <Text>Help Center</Text>
              <Text>How can we help you today?</Text>
            </View>
            <SearchableInput
  value=""
  onChangeText={(text) => {}}
  placeholder="Search..."
 />
            <View
  style={{"gap":15.992748260498047,"paddingTop":23.998260498046875,"paddingRight":15.992767333984375,"paddingLeft":15.992767333984375}}
>
              <Text
  style={{"color":"#101828","fontSize":16,"fontWeight":400,"fontFamily":"Inter"}}
>Common Issues</Text>
              <View
  style={{"flexDirection":"row","gap":12,"alignItems":"center"}}
>
                <View style={{"gap":12}}>
                  <Card variant="elevated" padding="md" onPress={() => {}} />
                  <Card variant="elevated" padding="md" onPress={() => {}} />
                  <Card variant="elevated" padding="md" onPress={() => {}} />
                  <Card variant="elevated" padding="md" onPress={() => {}} />
                  <Card variant="elevated" padding="md" onPress={() => {}} />
                  <Card variant="elevated" padding="md" onPress={() => {}} />
                </View>
              </View>
            </View>
            <View
  style={{"gap":15.992778778076172,"paddingRight":15.992767333984375,"paddingLeft":15.992767333984375}}
>
              <Text
  style={{"color":"#101828","fontSize":16,"fontWeight":400,"fontFamily":"Inter"}}
>Contact Support</Text>
              <View
  style={{"gap":15.99276351928711,"paddingTop":23.99822998046875,"paddingRight":23.998241424560547,"paddingLeft":23.998249053955078,"borderRadius":14}}
>
                <View
  style={{"flexDirection":"row","gap":11.999122619628906,"alignItems":"center"}}
>
                  <View
  style={{"width":24,"height":24,"backgroundColor":"#E5E7EB"}}
 />
                  <View style={{"gap":3.993633270263672}}>
                    <Text
  style={{"color":"#FFFFFF","fontSize":16,"fontWeight":400,"fontFamily":"Inter"}}
>Chat with us</Text>
                    <Text
  style={{"color":"rgba(255, 255, 255, 0.90)","fontSize":14,"fontWeight":400,"fontFamily":"Inter"}}
>Average response time: 2 minutes</Text>
                  </View>
                </View>
                <Button
  text="Start Chat"
  variant="regular"
  size="md"
  onPress={() => {}}
  buttonStyle={{"backgroundColor":"#FFFFFF"}}
 />
              </View>
              <View>
                <Card variant="elevated" padding="md" onPress={() => {}} />
                <Card variant="elevated" padding="md" onPress={() => {}} />
              </View>
            </View>
            <View
  style={{"gap":15.992717742919922,"paddingTop":23.998291015625,"paddingRight":15.992767333984375,"paddingLeft":15.992767333984375,"backgroundColor":"#FFFFFF"}}
>
              <Text
  style={{"color":"#101828","fontSize":16,"fontWeight":400,"fontFamily":"Inter"}}
>Self-Help Resources</Text>
              <View style={{"gap":11.999107360839844}}>
                <Card variant="outlined" padding="md" onPress={() => {}} />
                <Card variant="outlined" padding="md" onPress={() => {}} />
                <Card variant="outlined" padding="md" onPress={() => {}} />
                <Card variant="outlined" padding="md" onPress={() => {}} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <Header showBackButton onBackPress={() => {}} />
    </SafeAreaView>
  );
}
