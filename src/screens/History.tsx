import { useCallback, useState } from 'react'
import { Heading, VStack, SectionList, Text, useToast } from 'native-base'

import { ScreenHeader } from '@components/ScreenHeader'
import { HistoryCard } from '@components/HistoryCard'
import { AppError } from '@utils/AppError'
import { api } from '@services/api'
import { historyByDayDTO } from '@dtos/historyByDayDTO'
import { useFocusEffect } from '@react-navigation/native'

export function History() {
  const [isLoading, setIsLoading] = useState(true)
  const [exercises, setExercises] = useState<historyByDayDTO[]>([])

  const Toast = useToast()

  async function fetchHistory() {
    try {
      setIsLoading(true)

      const response = await api.get('/history')

      setExercises(response.data)

    } catch (error) {
      const isAppError = error instanceof AppError

      const title = isAppError ? error.message : 'Unable to load the exercise history.'

      Toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useFocusEffect(useCallback(() => {
    fetchHistory()
  }, []))

  return (
    <VStack flex={1}>
      <ScreenHeader title="Exercise History" />

      <SectionList
        sections={exercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryCard data={item} />}
        renderSectionHeader={({ section }) => (
          <Heading
            color={"gray.200"}
            fontSize={"sm"}
            mt={5}
            mb={3}
            fontFamily={"heading"}
          >
            {section.title}
          </Heading>
        )}
        px={8}
        contentContainerStyle={exercises.length === 0 && { flex: 1, justifyContent: 'center' }}
        ListEmptyComponent={() => (
          <Text textAlign={"center"} color={"gray.100"}>
            There is no exercise history recorded yet! {'\n'}
            How about we get started with some exercise?
          </Text>
        )}
        showsVerticalScrollIndicator={false}
      >

      </SectionList>

    </VStack>
  )
}