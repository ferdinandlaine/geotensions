<?php

namespace App\Controller;

use App\Repository\EventRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\Routing\Attribute\Route;

class EventsController extends AbstractController
{
    public function __construct(
        private EventRepository $eventRepository
    ) {}

    #[Route('/events', name: 'events', methods: ['GET'])]
    #[OA\Get(
        path: '/api/events',
        summary: 'Lister les événements',
        description: 'Retourne les événements au format GeoJSON'
    )]
    #[OA\Parameter(
        name: 'bbox',
        description: 'Bounding box (minLon,minLat,maxLon,maxLat)',
        in: 'query',
        required: true,
        schema: new OA\Schema(type: 'string', example: '-5.5,41.0,10.0,51.5')
    )]
    #[OA\Parameter(
        name: 'date_from',
        description: 'Date de début (AAAA-MM-JJ)',
        in: 'query',
        required: true,
        schema: new OA\Schema(type: 'string', format: 'date', example: '2024-01-26')
    )]
    #[OA\Parameter(
        name: 'date_to',
        description: 'Date de fin (AAAA-MM-JJ)',
        in: 'query',
        required: true,
        schema: new OA\Schema(type: 'string', format: 'date', example: '2024-01-27')
    )]
    #[OA\Parameter(
        name: 'type[]',
        description: 'Type d\'événement',
        in: 'query',
        required: false,
        schema: new OA\Schema(
            type: 'array',
            items: new OA\Items(type: 'string'),
        ),
        example: ['Protests', 'Riots']
    )]
    #[OA\Parameter(
        name: 'limit',
        description: 'Nombre maximum d\'événements (performances)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer', default: 2500, minimum: 1, maximum: 5000, example: 2500)
    )]
    #[OA\Response(
        response: 200,
        description: 'GeoJSON FeatureCollection avec métadonnées',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'type', type: 'string', example: 'FeatureCollection'),
                new OA\Property(
                    property: 'features',
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'type', type: 'string', example: 'Feature'),
                            new OA\Property(property: 'id', type: 'string', example: 'FRA30321'),
                            new OA\Property(
                                property: 'geometry',
                                properties: [
                                    new OA\Property(property: 'type', type: 'string', example: 'Point'),
                                    new OA\Property(
                                        property: 'coordinates',
                                        type: 'array',
                                        items: new OA\Items(type: 'number', format: 'float'),
                                        example: [4.7615, 44.1776]
                                    )
                                ],
                                type: 'object'
                            ),
                            new OA\Property(
                                property: 'properties',
                                properties: [
                                    new OA\Property(property: 'date', type: 'string', format: 'date', example: '2024-01-26'),
                                    new OA\Property(property: 'type', type: 'string', example: 'Protests'),
                                    new OA\Property(property: 'sub_type', type: 'string', example: 'Excessive force against protesters'),
                                    new OA\Property(property: 'disorder_type', type: 'string', example: 'Political violence; Demonstrations'),
                                    new OA\Property(property: 'actor1', type: 'string', example: 'Protesters (France)'),
                                    new OA\Property(property: 'actor2', type: 'string', nullable: true, example: 'Rioters (France)'),
                                    new OA\Property(property: 'inter1', type: 'string', example: 'Protesters'),
                                    new OA\Property(property: 'inter2', type: 'string', nullable: true, example: 'Rioters'),
                                    new OA\Property(property: 'assoc_actor_1', type: 'string', nullable: true, example: 'Farmers (France); FNSEA: National Federation of Farmers Unions; JA: Young Farmers'),
                                    new OA\Property(property: 'assoc_actor_2', type: 'string', nullable: true, example: 'Labor Group (France)'),
                                    new OA\Property(property: 'interaction', type: 'string', example: 'Rioters-Protesters'),
                                    new OA\Property(property: 'iso', type: 'integer', example: 250),
                                    new OA\Property(property: 'region', type: 'string', example: 'Europe'),
                                    new OA\Property(property: 'country', type: 'string', example: 'France'),
                                    new OA\Property(property: 'admin1', type: 'string', example: 'Provence-Alpes-Cote d\'Azur'),
                                    new OA\Property(property: 'admin2', type: 'string', nullable: true, example: 'Vaucluse'),
                                    new OA\Property(property: 'admin3', type: 'string', nullable: true, example: 'Carpentras'),
                                    new OA\Property(property: 'location', type: 'string', example: 'Piolenc'),
                                    new OA\Property(property: 'latitude', type: 'number', format: 'double', example: 44.1776),
                                    new OA\Property(property: 'longitude', type: 'number', format: 'double', example: 4.7615),
                                    new OA\Property(property: 'geo_precision', type: 'integer', example: 1),
                                    new OA\Property(property: 'civilian_targeting', type: 'boolean', example: true),
                                    new OA\Property(property: 'fatalities', type: 'integer', example: 0),
                                    new OA\Property(property: 'source', type: 'string', example: 'France 3 Regions'),
                                    new OA\Property(property: 'source_scale', type: 'string', example: 'National'),
                                    new OA\Property(property: 'notes', type: 'string', example: 'On 26 January 2024, in the morning, farmers set up a road blockade on the A7 highway in Piolenc (Provence-Alpes-Cote d\'Azur). The event was part of a nationwide farmers\' demonstration movement called by FNSEA and JA against rising production costs, stricter environmental norms restricting the use of pesticides, foreign imports, and bureaucratic constraints. One demonstrator was knocked down by a lorry attempting to break through the roadblock after the farmers blocking the road started to inspect the lorry\'s cargo, sustaining mild injuries to his wrist.'),
                                    new OA\Property(property: 'tags', type: 'string', nullable: true, example: 'crowd size=no report'),
                                    new OA\Property(property: 'timestamp', type: 'integer', example: 1712695337),
                                    new OA\Property(property: 'imported_at', type: 'string', format: 'date-time', example: '2024-04-09T19:28:57Z'),
                                    new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2024-04-09T19:28:57Z')
                                ],
                                type: 'object'
                            )
                        ],
                        type: 'object'
                    )
                ),
                new OA\Property(property: 'is_truncated', type: 'boolean', example: false),
                new OA\Property(property: 'total_count', type: 'integer', example: 1),
            ],
            type: 'object'
        )
    )]
    public function getEvents(
        #[MapQueryParameter] string $bbox,
        #[MapQueryParameter] string $date_from,
        #[MapQueryParameter] string $date_to,
        #[MapQueryParameter] ?array $type,
        #[MapQueryParameter] int $limit = 2500
    ): JsonResponse {
        // Parse bbox (format: minLon,minLat,maxLon,maxLat)
        $bbox = explode(',', $bbox);
        if (count($bbox) !== 4) {
            return $this->json([
                'error' => 'invalid_bbox',
                'message' => 'bbox must be in format: minLon,minLat,maxLon,maxLat'
            ], 400);
        }

        // Validate date parameters
        $dates = ['date_from' => $date_from, 'date_to' => $date_to];
        foreach ($dates as $key => $value) {
            $dateObj = \DateTime::createFromFormat('Y-m-d', $value);
            if (!$dateObj || $dateObj->format('Y-m-d') !== $value) {
                return $this->json([
                    'error' => 'invalid_date',
                    'message' => "{$key} must be a valid date in YYYY-MM-DD format"
                ], 400);
            }
        }

        if ($date_from > $date_to) {
            return $this->json([
                'error' => 'invalid_date_range',
                'message' => 'date_from cannot exceed date_to'
            ], 400);
        }

        $filters = [
            'bbox' => $bbox,
            'date_from' => $date_from,
            'date_to' => $date_to
        ];

        if ($type && ($type = array_values(array_filter($type)))) {
            $filters['types'] = $type;
        }

        // Sanitize limit parameter (clamped: 1-5000)
        $limit = max(1, min(5000, $limit));

        $events = $this->eventRepository->find($filters, $limit);

        // Extract total count from window function
        $totalCount = !empty($events) ? (int) $events[0]['total_count'] : 0;

        // Transform to GeoJSON format
        $features = [];
        foreach ($events as $event) {
            $geometry = json_decode($event['geom'], true);

            // Extract acled_id for Feature ID
            $acledId = $event['acled_id'];

            // Format timestamps without milliseconds (ISO 8601 with Z for UTC)
            $importedAt = new \DateTime($event['imported_at']);
            $updatedAt = new \DateTime($event['updated_at']);
            $event['imported_at'] = $importedAt->format('Y-m-d\TH:i:s\Z');
            $event['updated_at'] = $updatedAt->format('Y-m-d\TH:i:s\Z');

            // Remove from properties to avoid duplication
            unset($event['geom'], $event['acled_id'], $event['id'], $event['total_count']);

            $features[] = [
                'type' => 'Feature',
                'id' => $acledId,
                'geometry' => $geometry,
                'properties' => $event
            ];
        }

        $geojson = [
            'type' => 'FeatureCollection',
            'features' => $features,
            'is_truncated' => $totalCount > $limit,
            'total_count' => $totalCount,
        ];

        return $this->json($geojson);
    }
}
