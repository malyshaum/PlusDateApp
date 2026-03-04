<?php

namespace App\Http\Controllers\Storage;

use App\Dto\Storage\SaveFileDto;
use App\Enums\Core\FileTypeEnum;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storage\DeleteFileRequest;
use App\Http\Requests\Storage\UploadPhotoRequest;
use App\Http\Requests\User\UploadVideoRequest;
use App\Services\User\FileService;
use AutoMapperPlus\AutoMapper;
use AutoMapperPlus\Exception\UnregisteredMappingException;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class FileController extends Controller
{
    public function __construct(
        private readonly FileService $fileService,
        private readonly AutoMapper $autoMapper,
    )
    {
        //
    }

    /**
     * @throws UnregisteredMappingException
     * @throws ApiException
     */
    public function uploadPhoto(UploadPhotoRequest $request): JsonResponse
    {
        /** @see ArrayToSaveFileDtoMapping */
        $saveFileDto = $this->autoMapper->map(
            $request->validated(),
            SaveFileDto::class,
            ['file_type' => FileTypeEnum::IMAGE->value],
        );

        $userFile = $this->fileService->savePhoto($saveFileDto);

        return $this->response($userFile);
    }

    /**
     * @throws UnregisteredMappingException
     * @throws ApiException
     */
    public function uploadVideo(UploadVideoRequest $request): JsonResponse
    {
        /** @see ArrayToSaveFileDtoMapping */
        $saveFileDto = $this->autoMapper->map(
            $request->validated(),
            SaveFileDto::class,
            ['file_type' => FileTypeEnum::VIDEO->value],
        );

        $userFile = $this->fileService->saveVideo($saveFileDto);
        return $this->response($userFile);
    }

    /**
     * @throws ApiException
     */
    public function delete(DeleteFileRequest $request): JsonResponse
    {
        $this->fileService->delete($request->integer('id'));
        return $this->response(null, Response::HTTP_NO_CONTENT);
    }
}
