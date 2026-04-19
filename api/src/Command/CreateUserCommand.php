<?php

namespace App\Command;

use App\Repository\UserRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:create-user',
    description: 'Create a new user with a bcrypt-hashed password',
)]
class CreateUserCommand
{
    public function __construct(
        private UserRepository $userRepository
    ) {}

    public function __invoke(
        #[Argument] string $username,
        #[Argument] string $password,
        OutputInterface $output
    ): int {
        try {
            $id = $this->userRepository->createUser($username, $password);
            $output->writeln("User <info>{$username}</info> created (id: {$id})");
            return Command::SUCCESS;
        } catch (\Doctrine\DBAL\Exception\UniqueConstraintViolationException $e) {
            $output->writeln("<error>Username '{$username}' already exists</error>");
            return Command::FAILURE;
        }
    }
}
