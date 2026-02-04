import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, Header, ListItem, SearchableInput, Spacer } from '../components';
import { Menu } from 'lucide-react-native';

export default function GeneratedScreen({ navigation }: any) {
  return (
    <SafeAreaView
  style={{"flex":1,"flexDirection":"row","gap":10,"alignItems":"center","backgroundColor":"#FFFFFF","paddingHorizontal":32}}
>
      <ScrollView
  contentContainerStyle={{"backgroundColor":"#F9FAFB"}}
  backgroundColor="#FFFFFF"
  paddingHorizontal={24}
>
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
            <Spacer size={12} />
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
              <View style={{"gap":12}}>
                <View
  style={{"paddingTop":16.57501220703125,"paddingRight":16.57497787475586,"paddingBottom":0.5822169780731201,"paddingLeft":16.57498550415039,"backgroundColor":"#FFFFFF","borderRadius":14,"borderColor":"#E5E7EB","borderWidth":0.5822169780731201}}
>
                  <ListItem
  title="Billing & Payments"
  subtitle="Payment methods, invoices, refunds"
  leftElement={<View
  style={{"width":24,"height":24,"backgroundColor":"#E5E7EB"}}
 />}
 />
                </View>
                <Spacer size={12} />
                <View
  style={{"paddingTop":16.574981689453125,"paddingRight":16.57497787475586,"paddingBottom":0.5822169780731201,"paddingLeft":16.57498550415039,"backgroundColor":"#FFFFFF","borderRadius":14,"borderColor":"#E5E7EB","borderWidth":0.5822169780731201}}
>
                  <ListItem
  title="Account Management"
  subtitle="Login, password, profile settings"
  leftElement={<View
  style={{"width":24,"height":24,"backgroundColor":"#E5E7EB"}}
 />}
 />
                </View>
                <Spacer size={12} />
                <View
  style={{"paddingTop":16.57501220703125,"paddingRight":16.57497787475586,"paddingBottom":0.5822169780731201,"paddingLeft":16.57498550415039,"backgroundColor":"#FFFFFF","borderRadius":14,"borderColor":"#E5E7EB","borderWidth":0.5822169780731201}}
>
                  <ListItem
  title="TV Signal Issues"
  subtitle="No signal, poor quality, troubleshooting"
  leftElement={<View
  style={{"width":24,"height":24,"backgroundColor":"#E5E7EB"}}
 />}
 />
                </View>
                <Spacer size={12} />
                <View
  style={{"paddingTop":16.574951171875,"paddingRight":16.57497787475586,"paddingBottom":0.5822169780731201,"paddingLeft":16.57498550415039,"backgroundColor":"#FFFFFF","borderRadius":14,"borderColor":"#E5E7EB","borderWidth":0.5822169780731201}}
>
                  <ListItem
  title="Subscription Plans"
  subtitle="Upgrade, downgrade, cancel subscription"
  leftElement={<View
  style={{"width":24,"height":24,"backgroundColor":"#E5E7EB"}}
 />}
 />
                </View>
                <Spacer size={12} />
                <View
  style={{"paddingTop":16.57501220703125,"paddingRight":16.57497787475586,"paddingBottom":0.5822169780731201,"paddingLeft":16.57498550415039,"backgroundColor":"#FFFFFF","borderRadius":14,"borderColor":"#E5E7EB","borderWidth":0.5822169780731201}}
>
                  <ListItem
  title="Connectivity"
  subtitle="Internet issues, streaming problems"
  leftElement={<View
  style={{"width":24,"height":24,"backgroundColor":"#E5E7EB"}}
 />}
 />
                </View>
                <Spacer size={12} />
                <View
  style={{"paddingTop":16.57501220703125,"paddingRight":16.57497787475586,"paddingBottom":0.5822169780731201,"paddingLeft":16.57498550415039,"backgroundColor":"#FFFFFF","borderRadius":14,"borderColor":"#E5E7EB","borderWidth":0.5822169780731201}}
>
                  <ListItem
  title="Diagnostics"
  subtitle="Diagnose your device, check connection"
  leftElement={<View
  style={{"width":24,"height":24,"backgroundColor":"#E5E7EB"}}
 />}
 />
                </View>
              </View>
            </View>
            <Spacer size={12} />
            <View
  style={{"gap":15.992778778076172,"paddingRight":15.992767333984375,"paddingLeft":15.992767333984375}}
>
              <Text
  style={{"color":"#101828","fontSize":16,"fontWeight":400,"fontFamily":"Inter"}}
>Contact Support</Text>
              <LinearGradient
  colors={["#155DFC","#4F39F6"]}
  locations={[0,1]}
  start={{"x":0,"y":0}}
  end={{"x":1,"y":1}}
  style={{"gap":15.99276351928711,"paddingTop":23.99822998046875,"paddingRight":23.998241424560547,"paddingBottom":24,"paddingLeft":23.998249053955078,"borderRadius":14}}
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
                <Spacer size={12} />
                <Button
  text="Start Chat"
  variant="regular"
  size="md"
  onPress={() => {}}
  buttonStyle={{"backgroundColor":"#FFFFFF"}}
 />
              </LinearGradient>
              <Spacer size={12} />
              <View>
                <Card variant="elevated" padding="md" onPress={() => {}} />
                <Card variant="elevated" padding="md" onPress={() => {}} />
              </View>
            </View>
            <Spacer size={12} />
            <View
  style={{"gap":15.992717742919922,"paddingTop":23.998291015625,"paddingRight":15.992767333984375,"paddingLeft":15.992767333984375,"backgroundColor":"#FFFFFF"}}
>
              <Text
  style={{"color":"#101828","fontSize":16,"fontWeight":400,"fontFamily":"Inter"}}
>Self-Help Resources</Text>
              <View style={{"gap":11.999107360839844}}>
                <Card variant="outlined" padding="none">
                  <View>
                    <Text
  style={{"color":"#101828","fontSize":16,"fontWeight":700,"fontFamily":"Inter"}}
>Outlined Card</Text>
                    <Text
  style={{"color":"#4A5565","fontSize":14,"fontWeight":400,"fontFamily":"Inter"}}
>This card has a border.</Text>
                  </View>
                </Card>
                <Card variant="outlined" padding="none">
                  <Text
  style={{"color":"#101828","fontSize":16,"fontWeight":400,"fontFamily":"Inter"}}
>Troubleshooting TV signal issues</Text>
                  <Text
  style={{"color":"#4A5565","fontSize":14,"fontWeight":400,"fontFamily":"Inter"}}
>Common fixes for signal problems</Text>
                </Card>
                <Card variant="outlined" padding="none">
                  <Text
  style={{"color":"#101828","fontSize":16,"fontWeight":400,"fontFamily":"Inter"}}
>Payment methods and billing</Text>
                  <Text
  style={{"color":"#4A5565","fontSize":14,"fontWeight":400,"fontFamily":"Inter"}}
>Everything about payments and invoices</Text>
                </Card>
                <Card variant="outlined" padding="none">
                  <Text
  style={{"color":"#101828","fontSize":16,"fontWeight":400,"fontFamily":"Inter"}}
>Understanding rewards points</Text>
                  <Text
  style={{"color":"#4A5565","fontSize":14,"fontWeight":400,"fontFamily":"Inter"}}
>How to earn and redeem points</Text>
                </Card>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <Header
  title="Cignal One"
  backgroundColor="#FFFFFF"
  showBackButton={false}
  leftAction={(<Menu size={24} color="#000" />)}
  rightAction={(<TouchableOpacity onPress={() => {}}><Menu size={24} color="#000" /></TouchableOpacity>)}
  containerStyle={{"borderBottomWidth":1,"borderBottomColor":"#E5E7EB"}}
 />
    </SafeAreaView>
  );
}
