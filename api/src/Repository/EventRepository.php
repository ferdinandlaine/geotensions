<?php

namespace App\Repository;

use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

class EventRepository
{
    private const FIELDS_ALLOWLIST = [
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
        'iso',
        'region',
        'country',
        'admin1',
        'admin2',
        'admin3',
        'location',
        'geo_precision',
        'civilian_targeting',
        'fatalities',
        'source',
        'source_scale',
        'notes',
        'tags',
    ];

    /**
     * Canonical ACLED event types and sub-types
     *
     * This order reflects the ACLED severity hierarchy: when multiple tactics
     * occur simultaneously at the same location and time, the higher-ranked
     * event type subsumes lower ones to avoid double-counting.
     *
     * @see https://acleddata.com/methodology/acled-codebook#acled-events-2
     */
    public const TYPE_ALLOWLIST = [
        'Battles' => ['Government regains territory', 'Non-state actor overtakes territory', 'Armed clash'],
        'Protests' => ['Excessive force against protesters', 'Protest with intervention', 'Peaceful protest'],
        'Riots' => ['Violent demonstration', 'Mob violence'],
        'Explosions/Remote violence' => ['Chemical weapon', 'Air/drone strike', 'Suicide bomb', 'Shelling/artillery/missile attack', 'Remote explosive/landmine/IED', 'Grenade'],
        'Violence against civilians' => ['Sexual violence', 'Attack', 'Abduction/forced disappearance'],
        'Strategic developments' => ['Agreement', 'Arrests', 'Change to group/activity', 'Disrupted weapons use', 'Headquarters or base established', 'Looting/property destruction', 'Non-violent transfer of territory', 'Other'],
    ];

    public function __construct(
        private Connection $connection
    ) {}

    /**
     * Find events matching the given filters, with deterministic spatial sampling.
     *
     * ORDER BY sample_order produces a deterministic pseudo-random ordering,
     * ensuring consistent results across identical queries.
     *
     * @param array $bbox [minLon, minLat, maxLon, maxLat]
     * @param string $dateFrom Start date (YYYY-MM-DD)
     * @param string $dateTo End date (YYYY-MM-DD)
     * @param ?array $types Event types to filter by
     * @param ?array $fields Fields to include in properties
     * @param int $limit Maximum number of results
     * @return array Array of events with geometry as GeoJSON
     */
    public function findEvents(
        array $bbox,
        string $dateFrom,
        string $dateTo,
        ?array $types,
        ?array $fields,
        int $limit = 2500
    ): array {
        $qb = $this->connection->createQueryBuilder();

        [$minLon, $minLat, $maxLon, $maxLat] = $bbox;
        $fields = $fields !== null
            ? array_values(array_intersect(self::FIELDS_ALLOWLIST, $fields))
            : self::FIELDS_ALLOWLIST;

        $qb->select(...array_merge(['acled_id'], ['ST_AsGeoJSON(geom) as geom'], $fields))
            ->from('events')
            ->where('geom && ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326)')
            ->andWhere('date >= :date_from')
            ->andWhere('date <= :date_to')
            ->setParameter('minLon', $minLon)
            ->setParameter('minLat', $minLat)
            ->setParameter('maxLon', $maxLon)
            ->setParameter('maxLat', $maxLat)
            ->setParameter('date_from', $dateFrom)
            ->setParameter('date_to', $dateTo);

        if (!empty($types)) {
            $typeKeys = array_keys(self::TYPE_ALLOWLIST);
            $parentTypes = array_values(array_intersect($types, $typeKeys));
            $subTypes  = array_values(array_diff($types, $typeKeys));

            $conditions = [];
            if (!empty($parentTypes)) {
                $qb->setParameter('types', $parentTypes, ArrayParameterType::STRING);
                $conditions[] = $qb->expr()->in('type', ':types');
            }
            if (!empty($subTypes)) {
                $qb->setParameter('sub_types', $subTypes, ArrayParameterType::STRING);
                $conditions[] = $qb->expr()->in('sub_type', ':sub_types');
            }
            $qb->andWhere($qb->expr()->or(...$conditions));
        }

        $qb->orderBy('sample_order', 'ASC')
            ->addOrderBy('id', 'ASC')
            ->setMaxResults($limit);

        $result = $qb->executeQuery();
        return $result->fetchAllAssociative();
    }

    /**
     * Find all distinct event types with their subtypes
     *
     * @return array Associative array with types as keys and subtypes arrays as values
     */
    public function findDistinctTypes(): array
    {
        $qb = $this->connection->createQueryBuilder();

        $qb->select('DISTINCT type', 'sub_type')
            ->from('events');

        $result = $qb->executeQuery();
        $rows = $result->fetchAllAssociative();

        $types = [];
        foreach ($rows as $row) {
            $types[$row['type']][] = $row['sub_type'];
        }

        // Sort types and sub-types according to canonical ACLED hierarchy
        $typeKeys = array_keys(self::TYPE_ALLOWLIST);
        $subTypeIndex = array_map('array_flip', self::TYPE_ALLOWLIST);

        uksort(
            $types,
            fn($a, $b) => (array_search($a, $typeKeys) ?? PHP_INT_MAX)
                <=> (array_search($b, $typeKeys) ?? PHP_INT_MAX)
        );

        foreach ($types as $type => &$subTypes) {
            $index = $subTypeIndex[$type] ?? [];
            usort(
                $subTypes,
                fn($a, $b) => ($index[$a] ?? PHP_INT_MAX) <=> ($index[$b] ?? PHP_INT_MAX)
            );
        }

        return $types;
    }
}
