<?php

namespace App\Jobs\File;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

class CreateBlurredPhotoJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private readonly string $filePath
    )
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(
        ImageManager $imageManager
    ): void
    {
        Log::info('[CreateBlurredPhotoJob] starting job for '.$this->filePath);
        $blurredImage = $imageManager
            ->read(Storage::get($this->filePath))
            ->blur(100)
            ->blur(100)
            ->toWebp(quality: 85);

        $originalFileName = basename($this->filePath);
        $blurredFileName = 'blurred_' . $originalFileName;

        $blurredPath = Str::replace($originalFileName, $blurredFileName, $this->filePath);

        Storage::put($blurredPath, $blurredImage);

        Log::info('[CreateBlurredPhotoJob] finished for '.$this->filePath);
    }
}
