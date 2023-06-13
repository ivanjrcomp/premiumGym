import { useState } from 'react';
import { useNavigation } from '@react-navigation/native'

import { useAuth } from '@hooks/useAuth';

import { api } from '@services/api';

import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form'
import * as yup from "yup";

import { VStack, Image, Text, Center, Heading, ScrollView, useToast } from 'native-base'

import { AppError } from '@utils/AppError';

import LogoSvg from '@assets/logo.svg'
import BackgroundImg from '@assets/background.png'

import { Input } from '@components/Input'
import { Button } from '@components/Button'

type FormDataProps = {
  name: string
  email: string
  password: string
  password_confirm: string
}

const signUpSchema = yup.object({
  name: yup.string().required('Please fill in the Name!'),
  email: yup.string().required('Please fill in the E-mail!').email('Invalid E-mail!'),
  password: yup.string()
    .required('Please fill in the Password')
    .min(6, 'The password must be at least 6 characters long!')
    .max(25, 'The password cannot exceed 25 characters!'),
  password_confirm: yup.string()
    .required('Please fill in the Password')
    .min(6, 'The password must be at least 6 characters long!')
    .max(25, 'The password cannot exceed 25 characters!')
    .oneOf([yup.ref('password'), ''], 'The password confirmation does not match the entered password!')
})

export function SignUp() {
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()

  const Toast = useToast()

  const { control, handleSubmit, formState: { errors } } = useForm<FormDataProps>({
    resolver: yupResolver(signUpSchema)
  })

  const navigation = useNavigation()

  function handleGoBack() {
    navigation.goBack()
  }

  async function handleSignUp({ name, email, password }: FormDataProps) {
    try {
      setIsLoading(true)

      await api.post('/users', { name, email, password })

      await signIn(email, password)
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError ? error.message : `Unable to process sign up at the moment. ${'\n'}Please try again later!`

      setIsLoading(false)
      Toast.closeAll();
      Toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })


    }

    /*fetch('http://10.0.0.197:3333/users', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    }).then(response => response.json())
      .then(jsonResponse => console.log(jsonResponse))*/


  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <VStack flex={1} px={10} pb={16}>
        <Image
          source={BackgroundImg}
          defaultSource={BackgroundImg}
          alt='Training participants'
          resizeMode='contain'
          position="absolute"
        />

        <Center my={24}>
          <LogoSvg />

          <Text color={"gray.100"} fontSize={"sm"}>
            Train your mind and body
          </Text>

        </Center>

        <Center>
          <Heading fontSize={"xl"} color={"gray.100"} mb={"6"} fontFamily={"heading"}>
            Create your account
          </Heading>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder='Name'
                onChangeText={onChange}
                value={value}
                errorMessage={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder='E-mail'
                keyboardType='email-address'
                autoCapitalize='none'
                onChangeText={onChange}
                value={value}
                errorMessage={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder='Password'
                secureTextEntry
                onChangeText={onChange}
                value={value}
                errorMessage={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password_confirm"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder='Confirm your password'
                secureTextEntry
                onChangeText={onChange}
                value={value}
                onSubmitEditing={handleSubmit(handleSignUp)}
                returnKeyType='send'
                errorMessage={errors.password_confirm?.message}
              />
            )}
          />

          <Button
            title='Create and access'
            onPress={handleSubmit(handleSignUp)}
            isLoading={isLoading}
          />
        </Center>

        <Button
          title='Return to Sign In'
          variant={"outline"}
          mt={12}
          onPress={handleGoBack}
        />


      </VStack >
    </ScrollView>
  )
}