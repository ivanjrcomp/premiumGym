import { useState } from 'react'
import { Alert, TouchableOpacity } from 'react-native'
import { Center, ScrollView, Text, VStack, Skeleton, Heading, useToast } from 'native-base'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'

import defaultUserPhotoImg from '@assets/userPhotoDefault.png'

import { useForm, Controller } from 'react-hook-form'

import { Input } from '@components/Input'
import { Button } from '@components/Button'
import { UserPhoto } from '@components/UserPhoto'
import { ScreenHeader } from '@components/ScreenHeader'

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useAuth } from '@hooks/useAuth'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'

const PHOTO_SIZE = 33

type FormDataProps = {
  name: string
  email: string
  old_password: string
  password: string
  re_enter_password: string
}

const profileSchema = yup.object({
  name: yup.string().required('Please fill in the Name!'),
  password: yup.string()
    .min(6, 'The password must be at least 6 characters long!')
    .max(25, 'The password cannot exceed 25 characters!')
    .nullable()
    .transform((value =>
      !!value ? value : null
    )),
  re_enter_password: yup.string()
    .nullable()
    .transform((value =>
      !!value ? value : null
    ))
    .oneOf([yup.ref('password'), ''], 'The password confirmation does not match the entered new password!')
    .when('password', {
      is: (Field: any) => Field,
      then: (schema) =>
        schema
          .nullable()
          .transform((value => !!value ? value : null))
          .required('Please, re-enter the new password to update!'),
    }),
})

export function Profile() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [photoIsLoading, setPhotoIsLoading] = useState(false)

  const toast = useToast()
  const { user, updateUserProfile } = useAuth()

  const { control, handleSubmit, formState: { errors } } = useForm<FormDataProps>({
    defaultValues: {
      name: user.name,
      email: user.email
    },
    resolver: yupResolver(profileSchema),
  })

  async function handleProfileUpdate(data: FormDataProps) {
    try {
      setIsUpdating(true)

      const userUpdated = user
      userUpdated.name = data.name

      await api.put('/users', data)

      await updateUserProfile(userUpdated)

      toast.show({
        title: 'User was updated successfully!',
        placement: 'top',
        bgColor: 'green.500'
      })

    } catch (error) {
      const isAppErro = error instanceof AppError
      const title = isAppErro ? error.message : "It's not possible to update the user at the moment. Please try again later!"

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleUserPhotoUpdate() {
    try {

      setPhotoIsLoading(true)
      const photoSelected = await ImagePicker.launchImageLibraryAsync(
        {
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
          aspect: [4, 4],
          allowsEditing: true,
          selectionLimit: 1,
        }
      )

      if (photoSelected.canceled) {
        return
      }
      const photoSelectedUri = photoSelected.assets[0].uri

      if (photoSelectedUri) {
        const photoInfo = await FileSystem.getInfoAsync(photoSelectedUri)

        if (photoInfo.exists && (photoInfo.size / 1024 / 1024 > 5)) {
          return toast.show({
            description: 'The selected image is oversized, please choose another one (max 5Mb)!',
            placement: 'top',
            bgColor: 'red.500',
          })
        }

        //setUserPhoto(photoSelectedUri);
        const fileExtension = photoSelectedUri.split('.').pop()
        const photoFile = {
          name: `${user.name}.${fileExtension}`.toLowerCase(),
          uri: photoSelectedUri,
          type: `${photoSelected.assets[0].type}/${fileExtension}`
        } as any

        const userPhotoUploadForm = new FormData()
        userPhotoUploadForm.append('avatar', photoFile)

        const avatarUpdatedResponse = await api.patch('/users/avatar', userPhotoUploadForm, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        const userUpdated = user
        userUpdated.avatar = avatarUpdatedResponse.data.avatar

        updateUserProfile(userUpdated)

        toast.show({
          title: 'Your profile photo has been successfully updated!',
          placement: 'top',
          bgColor: 'green.500'
        })
      }

    } catch (error) {
      console.log(error)
    } finally {
      setPhotoIsLoading(false)
    }
  }



  return (

    <VStack flex={1}>
      <ScreenHeader title='Profile' />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <Center mt={6} px={10}>
          {photoIsLoading ?
            <Skeleton
              w={PHOTO_SIZE}
              h={PHOTO_SIZE}
              rounded="full"
              startColor={"gray.500"}
              endColor={"gray.400"}
            />
            :
            <UserPhoto
              source={user.avatar ? { uri: `${api.defaults.baseURL}/avatar/${user.avatar}` } : defaultUserPhotoImg}
              alt="User photo"
              size={PHOTO_SIZE}
            />}

          <TouchableOpacity onPress={handleUserPhotoUpdate}>
            <Text
              color={"green.500"}
              fontWeight={"bold"}
              mt={2}
              mb={8}
            >
              Change Photo</Text>
          </TouchableOpacity>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder='Name'
                bg={"gray.600"}
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
                bg={"gray.600"}
                isDisabled
                value={value}
              />
            )}
          />
        </Center>

        <VStack px={10} mt={12} mb={9}>

          <Heading
            color={"gray.200"}
            fontSize={"md"}
            fontFamily={"heading"}
            mb={2}
            alignSelf={"flex-start"}
            mt={12}>
            Change Password
          </Heading>

          <Controller
            control={control}
            name="old_password"
            render={({ field: { onChange } }) => (
              <Input
                placeholder='Old Password'
                bg={"gray.600"}
                secureTextEntry
                onChangeText={onChange}
                errorMessage={errors.old_password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange } }) => (
              <Input
                placeholder='New Password'
                bg={"gray.600"}
                secureTextEntry
                onChangeText={onChange}
                errorMessage={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="re_enter_password"
            render={({ field: { onChange } }) => (
              <Input
                placeholder='Re-enter Password'
                bg={"gray.600"}
                secureTextEntry
                onChangeText={onChange}
                errorMessage={errors.re_enter_password?.message}
              />
            )}
          />

          <Button
            title='Update'
            onPress={handleSubmit(handleProfileUpdate)}
          />

        </VStack>

      </ScrollView>

    </VStack>

  )
}