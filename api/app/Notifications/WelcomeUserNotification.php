<?php

declare(strict_types=1);

// app/Notifications/WelcomeUserNotification.php
// Invite email with set-password link. Token must never be logged (see SECURITY.md).

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeUserNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $token
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');
        $url = $frontendUrl.'/set-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getAttribute('email'),
        ]);

        return (new MailMessage)
            ->subject('Welcome – Set your password')
            ->line('You have been invited to the Smart IoT platform.')
            ->action('Set your password', $url)
            ->line('This link expires in 60 minutes.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [];
    }
}
