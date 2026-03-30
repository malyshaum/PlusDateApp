import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { IUser, IUserPreferences } from "@/entities/user/model/types.ts"
import {
  deleteFile,
  deleteProfile,
  deleteUserVideo,
  files,
  getUserById,
  getUserLimits,
  getUserStats,
  login,
  me,
  onboard,
  replaceUserVideo,
  setUserMainPhoto,
  update,
  updatePreferences,
  updateUserFiles,
  updateUserPhoto,
  uploadPhoto,
  uploadVideo,
} from "@/entities/user/api/user.api.ts"
import Cookies from "js-cookie"
import { FEED_QUERY_KEYS, useSwipeFeedStore } from "@/features/SwipeCards"

interface UseQueryProps<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export const USER_KEYS = {
  user: "user",
  login: "login",
  me: "me",
  update: "update",
  deleteVideo: "deleteVideo",
  updatePreferences: "updatePreferences",
  updatePhoto: "updatePhoto",
  updateVideo: "updateVideo",
  updateFiles: "updateFiles",
  setUserMainPhoto: "setUserMainPhoto",
  limits: "limits",
  onboard: "onboard",
  uploadPhoto: "uploadPhoto",
  uploadVideo: "uploadVideo",
  deleteFile: "deleteFile",
  deleteProfile: "deleteProfile",
}

export const useUserLogin = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.login],
    mutationFn: login,
    onSuccess: async (res) => {
      if (res.token) {
        Cookies.set("auth_token", res.token)
        await queryClient.invalidateQueries({
          queryKey: [USER_KEYS.user, USER_KEYS.me],
        })
        onSuccess?.()
      }
    },
  })
}

export const useUser = () => {
  const hasToken = !!Cookies.get("auth_token")

  return useQuery({
    queryKey: [USER_KEYS.user, USER_KEYS.me],
    queryFn: me,
    enabled: hasToken,
    select: (res) => {
      return {
        ...res,
        files: res.files
          .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
          ?.sort((a, b) => (a.type === "video" ? 1 : 0) - (b.type === "video" ? 1 : 0)),
      }
    },
  })
}

export const useUserFiles = () => {
  return useQuery({
    queryKey: [USER_KEYS.user, "files"],
    queryFn: () => files(),
    refetchOnMount: "always",
  })
}

export const useUserUpdate = ({ onSuccess, onError }: UseQueryProps<IUser> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.update],
    mutationFn: update,
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({
        queryKey: [USER_KEYS.user, USER_KEYS.me],
      })

      onSuccess?.(res)
    },
    onError: (error) => {
      onError?.(error)
    },
  })
}

export const useUserUpdatePreferences = ({
  onSuccess,
  onError,
}: UseQueryProps<IUserPreferences> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.updatePreferences],
    mutationFn: updatePreferences,
    onSuccess: async (res) => {
      useSwipeFeedStore.getState().setIsResettingFilters(true)

      await queryClient.invalidateQueries({
        queryKey: FEED_QUERY_KEYS.profiles(),
        refetchType: "all",
      })

      await queryClient.invalidateQueries({
        queryKey: [USER_KEYS.user, USER_KEYS.me],
      })

      onSuccess?.(res)
    },
    onError: (error) => {
      onError?.(error)
    },
  })
}

export const useExternalUser = (userId?: number) => {
  return useQuery({
    queryKey: [USER_KEYS.user, userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
    refetchOnMount: "always",
  })
}

export const useUpdateUserPhoto = ({ onSuccess, onError }: UseQueryProps<IUser> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.updatePhoto],
    mutationFn: updateUserPhoto,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [USER_KEYS.user, USER_KEYS.me] })

      const previousUser = queryClient.getQueryData<IUser>([USER_KEYS.user, USER_KEYS.me])

      const blobUrl = URL.createObjectURL(variables.photos[0].file)
      const fileId = variables.photos[0].file_id

      queryClient.setQueryData<IUser>([USER_KEYS.user, USER_KEYS.me], (old) => {
        if (!old) return old
        return {
          ...old,
          files: old.files.map((f) => (f.id === fileId ? { ...f, url: blobUrl } : f)),
        }
      })

      return { previousUser, blobUrl }
    },
    onSuccess: async (res, _variables, context) => {
      if (context?.blobUrl) {
        URL.revokeObjectURL(context.blobUrl)
      }

      await queryClient.invalidateQueries({
        queryKey: [USER_KEYS.user, USER_KEYS.me],
      })

      onSuccess?.(res)
    },
    onError: (error, _variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData([USER_KEYS.user, USER_KEYS.me], context.previousUser)
      }
      if (context?.blobUrl) {
        URL.revokeObjectURL(context.blobUrl)
      }

      onError?.(error)
    },
  })
}

export const useUpdateUserFiles = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.updateFiles],
    mutationFn: updateUserFiles,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [USER_KEYS.user, USER_KEYS.me],
      })
    },
  })
}

export const useDeleteUserVideo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.deleteVideo],
    mutationFn: deleteUserVideo,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [USER_KEYS.user, USER_KEYS.me],
      })
    },
  })
}

export const useReplaceUserVideo = ({ onSuccess, onError }: UseQueryProps<void> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.updatePhoto],
    mutationFn: replaceUserVideo,
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({
        queryKey: [USER_KEYS.user, USER_KEYS.me],
      })
      onSuccess?.(res)
    },
    onError: (error) => {
      void queryClient.invalidateQueries({
        queryKey: [USER_KEYS.user, USER_KEYS.me],
      })
      onError?.(error)
    },
  })
}

export const useSetUserPhotoMain = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.setUserMainPhoto],
    mutationFn: setUserMainPhoto,
    onSuccess: (res) => {
      queryClient.setQueryData([USER_KEYS.user, USER_KEYS.me], (oldData: IUser | undefined) => {
        if (!oldData) return oldData
        return {
          ...res,
          search_preference: oldData.search_preference,
        }
      })
    },
  })
}

export const useUserLimits = () => {
  return useQuery({
    queryKey: [USER_KEYS.user, USER_KEYS.limits],
    queryFn: () => getUserLimits(),
    refetchOnMount: "always",
    select: (data) => ({
      likes: data.likes_day_limit - data.likes,
      superlikes: data.superlikes_day_limit - data.superlikes,
      likes_day_limit: data.likes_day_limit,
      superlikes_day_limit: data.superlikes_day_limit,
    }),
  })
}

export const useUserStats = (enabled: boolean) => {
  return useQuery({
    queryKey: [USER_KEYS.user, "stats"],
    queryFn: getUserStats,
    enabled,
    refetchOnMount: "always",
  })
}

export const useOnboard = ({ onSuccess, onError }: UseQueryProps<IUser> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.onboard],
    mutationFn: onboard,
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({
        queryKey: [USER_KEYS.user, USER_KEYS.me],
      })

      onSuccess?.(res)
    },
    onError: (error) => {
      onError?.(error)
    },
  })
}

export const useUploadPhoto = ({ onSuccess, onError }: UseQueryProps<IUser> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.uploadPhoto],
    mutationFn: uploadPhoto,
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({
        queryKey: [USER_KEYS.user, USER_KEYS.me],
      })

      onSuccess?.(res)
    },
    onError: (error) => {
      onError?.(error)
    },
  })
}

export const useUploadVideo = ({ onSuccess, onError }: UseQueryProps<IUser> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.uploadPhoto],
    mutationFn: uploadVideo,
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({
        queryKey: [USER_KEYS.user, USER_KEYS.me],
      })

      onSuccess?.(res)
    },
    onError: (error) => {
      onError?.(error)
    },
  })
}

export const useDeleteFile = ({ onSuccess, onError }: UseQueryProps<void> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.deleteFile],
    mutationFn: deleteFile,
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({
        queryKey: [USER_KEYS.user, USER_KEYS.me],
      })

      onSuccess?.(res)
    },
    onError: (error) => {
      onError?.(error)
    },
  })
}

export const useDeleteProfile = ({ onSuccess, onError }: UseQueryProps<void> = {}) => {
  return useMutation({
    mutationKey: [USER_KEYS.user, USER_KEYS.deleteProfile],
    mutationFn: deleteProfile,
    onSuccess: (res) => {
      onSuccess?.(res)
    },
    onError: (error) => {
      onError?.(error)
    },
  })
}
