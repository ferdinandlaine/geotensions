<?php

namespace App\Controller;

use App\Repository\UserRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class AuthController extends AbstractController
{
    public function __construct(
        private UserRepository $userRepository
    ) {}

    #[Route('/auth', name: 'auth', methods: ['POST'])]
    #[OA\Post(
        path: '/api/auth',
        summary: 'Authenticate',
        description: 'Exchange username and password for a bearer token valid for 1 week'
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['username', 'password'],
            properties: [
                new OA\Property(property: 'username', type: 'string', example: 'admin'),
                new OA\Property(property: 'password', type: 'string', example: 'secret'),
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Authentication successful',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'token', type: 'string', example: 'a1b2c3d4...'),
            ]
        )
    )]
    #[OA\Response(response: 401, description: 'Invalid credentials')]
    public function auth(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);

        if (empty($payload['username']) || empty($payload['password'])) {
            return $this->json(['error' => 'missing_credentials', 'message' => 'Username and password are required'], 400);
        }

        $username = trim(strtolower($payload['username']));
        $user = $this->userRepository->findByUsername($username);

        if (!$user || !password_verify($payload['password'], $user['password_hash'])) {
            return $this->json(['error' => 'invalid_credentials', 'message' => 'Invalid username or password'], 401);
        }

        $token = $this->userRepository->createToken($user['id']);

        return $this->json(['token' => $token]);
    }
}
