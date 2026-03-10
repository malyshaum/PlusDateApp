<?php

namespace App\Providers;

use App\Clients\ImmagaClient;
use Illuminate\Support\ServiceProvider;
use Intervention\Image\ImageManager;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ImageManager::class, function () {
            return ImageManager::imagick();
        });

        $this->app->singleton(ImmagaClient::class, function () {
            $immagaConfig = config('services.immaga');
            return new ImmagaClient(
                $immagaConfig['public'],
                $immagaConfig['private'],
                ImageManager::imagick()
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {

    }
}
