<?php

namespace App\Repository;

use Doctrine\DBAL\Connection;

class EventRepository
{
    public function __construct(
        private Connection $connection
    ) {}

    /**
     * Find events
     *
     * @param array $filters Array
     * @param int $limit Maximum number of results
     * @return array Array of events with geometry as GeoJSON
     */
    public function find(array $filters = [], int $limit = 2500): array
    {
        $qb = $this->connection->createQueryBuilder();

        $qb->select(
            'id',
            'acled_id',
            'date',
            'type',
            'sub_type',
            'disorder_type',
            'actor1',
            'actor2',
            'inter1',
            'inter2',
            'assoc_actor_1',
            'assoc_actor_2',
            'interaction',
            'iso',
            'region',
            'country',
            'admin1',
            'admin2',
            'admin3',
            'location',
            'latitude',
            'longitude',
            'geo_precision',
            'ST_AsGeoJSON(geom) as geom',
            'civilian_targeting',
            'fatalities',
            'source',
            'source_scale',
            'notes',
            'tags',
            'imported_at',
            'updated_at',
            'COUNT(*) OVER() as total_count'
        )
            ->from('events');

        // Apply filters
        if (isset($filters['bbox'])) {
            [$minLon, $minLat, $maxLon, $maxLat] = $filters['bbox'];
            $qb->andWhere('geom && ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326)')
                ->setParameter('minLon', $minLon)
                ->setParameter('minLat', $minLat)
                ->setParameter('maxLon', $maxLon)
                ->setParameter('maxLat', $maxLat);
        }

        if (isset($filters['date_from'])) {
            $qb->andWhere('date >= :date_from')
                ->setParameter('date_from', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $qb->andWhere('date <= :date_to')
                ->setParameter('date_to', $filters['date_to']);
        }

        if (isset($filters['types'])) {
            $qb->andWhere($qb->expr()->in('type', ':types'))
                ->setParameter('types', $filters['types'], \Doctrine\DBAL\ArrayParameterType::STRING);
        }

        $qb->orderBy('date', 'DESC')
            ->addOrderBy('id', 'DESC')
            ->setMaxResults($limit);

        $result = $qb->executeQuery();
        return $result->fetchAllAssociative();
    }
}
