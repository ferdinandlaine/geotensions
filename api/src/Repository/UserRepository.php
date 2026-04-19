<?php

namespace App\Repository;

use Doctrine\DBAL\Connection;

class UserRepository
{
    public function __construct(
        private Connection $connection
    ) {}

    public function findByUsername(string $username): ?array
    {
        $qb = $this->connection->createQueryBuilder();
        $row = $qb->select('id', 'username', 'password_hash')
            ->from('users')
            ->where('username = :username')
            ->setParameter('username', $username)
            ->executeQuery()
            ->fetchAssociative();

        return $row ?: null;
    }

    public function createUser(string $username, string $password): int
    {
        $this->connection->createQueryBuilder()
            ->insert('users')
            ->values([
                'username' => ':username',
                'password_hash' => ':password_hash',
            ])
            ->setParameter('username', trim(strtolower($username)))
            ->setParameter('password_hash', password_hash($password, PASSWORD_BCRYPT))
            ->executeStatement();

        return (int) $this->connection->lastInsertId();
    }

    public function createToken(int $userId): string
    {
        $token = bin2hex(random_bytes(32));
        $hashedToken = hash('sha256', $token);

        $this->connection->createQueryBuilder()
            ->insert('auth_tokens')
            ->values([
                'user_id' => ':user_id',
                'token' => ':token',
                'expires_at' => ':expires_at',
            ])
            ->setParameter('user_id', $userId)
            ->setParameter('token', $hashedToken)
            ->setParameter('expires_at', (new \DateTimeImmutable('+1 week'))->format('Y-m-d H:i:s'))
            ->executeStatement();

        return $token;
    }

    public function findValidToken(string $token): ?array
    {
        $hashedToken = hash('sha256', $token);
        $qb = $this->connection->createQueryBuilder();
        $row = $qb->select('t.id', 't.user_id', 'u.username')
            ->from('auth_tokens', 't')
            ->join('t', 'users', 'u', 't.user_id = u.id')
            ->where('t.token = :token')
            ->andWhere('t.expires_at > NOW()')
            ->setParameter('token', $hashedToken)
            ->executeQuery()
            ->fetchAssociative();

        return $row ?: null;
    }
}
