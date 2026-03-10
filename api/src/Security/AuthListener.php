<?php

namespace App\Security;

use App\Repository\UserRepository;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::CONTROLLER, priority: 10)]
class AuthListener
{
    public function __construct(
        private UserRepository $userRepository
    ) {}

    public function __invoke(ControllerEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        if (!$this->requiresAuth($event)) {
            return;
        }

        $request = $event->getRequest();
        $header = $request->headers->get('Authorization', '');

        if (!str_starts_with($header, 'Bearer ')) {
            $event->setController(fn () => new JsonResponse(
                ['error' => 'unauthorized', 'message' => 'Bearer token required'],
                401
            ));
            
            return;
        }

        $token = substr($header, 7);
        $tokenData = $this->userRepository->findValidToken($token);

        if (!$tokenData) {
            $event->setController(fn () => new JsonResponse(
                ['error' => 'unauthorized', 'message' => 'Invalid or expired token'],
                401
            ));

            return;
        }

        $request->attributes->set('auth_user_id', $tokenData['user_id']);
        $request->attributes->set('auth_username', $tokenData['username']);
    }

    private function requiresAuth(ControllerEvent $event): bool
    {
        $attributes = $event->getAttributes(RequireAuth::class);
        return !empty($attributes);
    }
}
