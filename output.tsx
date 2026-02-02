import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { Avatar, Button, Card, Checkbox, Chip, Dropdown, RadioGroup, Spacer } from '../components';

export default function GeneratedScreen() {
  return (
    <SafeAreaView
  style={{"flex":1,"backgroundColor":"#FFFFFF","paddingHorizontal":32}}
>
      <View style={{"gap":21}}>
        <Button
  text="Regular Button"
  variant="regular"
  size="sm"
  onPress={() => {}}
  buttonStyle={{"backgroundColor":"#0891B2"}}
 />
        <Button
  text="Outline Button"
  variant="outline"
  size="sm"
  onPress={() => {}}
 />
        <Button
  text="Ghost Button"
  variant="ghost"
  size="sm"
  onPress={() => {}}
 />
        <Button
  text="Disabled Button"
  variant="regular"
  size="sm"
  disabled
  rightIcon="Icon"
  onPress={() => {}}
  buttonStyle={{"backgroundColor":"#0891B2"}}
 />
      </View>
      <Spacer size={12} />
      <View
  style={{"flexDirection":"row","gap":35,"alignItems":"center"}}
>
        <Chip
  text="Selectable chip"
  selected={false}
  mode="flat"
  icon="SelectedIcon"
  onPress={() => {}}
 />
        <Chip text="Normal chip" selected={false} mode="flat" disabled />
        <Chip text="Disabled" selected={false} mode="flat" disabled />
      </View>
      <Spacer size={12} />
      <View style={{"gap":27}}>
        <RadioGroup
  options={[{"label":"Label","value":"Radio1"}]}
  onChange={(value) => {}}
 />
        <Checkbox checked onChange={(value) => {}} label="Label" />
        <Checkbox checked={false} onChange={(value) => {}} label="Label" />
        <Dropdown
  data={[]}
  onChange={(value) => {}}
  placeholder="Select Option"
 />
      </View>
      <Spacer size={12} />
      <View style={{"gap":20}}>
        <Card
  variant="outlined"
  padding="md"
  containerStyle={{"backgroundColor":"#FFFFFF"}}
>
          <Card variant="filled" padding="none">
            <View>
              <Text
  style={{"color":"#101828","fontSize":16,"fontWeight":700,"fontFamily":"Inter"}}
>Outlined Card</Text>
              <Text
  style={{"color":"#4A5565","fontSize":14,"fontWeight":400,"fontFamily":"Inter"}}
>This card has a border.</Text>
            </View>
          </Card>
        </Card>
        <Card
  variant="elevated"
  padding="md"
  containerStyle={{"backgroundColor":"#FFFFFF"}}
>
          <Card variant="filled" padding="none">
            <View>
              <Text
  style={{"color":"#101828","fontSize":16,"fontWeight":700,"fontFamily":"Inter"}}
>Elevated Card</Text>
              <Text
  style={{"color":"#4A5565","fontSize":14,"fontWeight":400,"fontFamily":"Inter"}}
>This card has a shadow effect.</Text>
            </View>
          </Card>
        </Card>
        <Card
  variant="outlined"
  padding="md"
  containerStyle={{"backgroundColor":"#D8F0FF"}}
>
          <Card variant="filled" padding="none">
            <View>
              <Text
  style={{"color":"#101828","fontSize":16,"fontWeight":400,"fontFamily":"Inter"}}
>Filled Card</Text>
              <Text
  style={{"color":"#4A5565","fontSize":14,"fontWeight":400,"fontFamily":"Inter"}}
>This card has a filled background.</Text>
            </View>
          </Card>
        </Card>
      </View>
      <Spacer size={12} />
      <View
  style={{"flexDirection":"row","gap":47,"alignItems":"center"}}
>
        <Avatar
  name="AB"
  size="xs"
  onPress={() => {}}
  containerStyle={{"backgroundColor":"#E3F2FD"}}
 />
        <Avatar
  name="CD"
  size="sm"
  onPress={() => {}}
  containerStyle={{"backgroundColor":"#E3F2FD"}}
 />
        <Avatar
  name="EF"
  size="md"
  onPress={() => {}}
  containerStyle={{"backgroundColor":"#E3F2FD"}}
 />
      </View>
    </SafeAreaView>
  );
}
